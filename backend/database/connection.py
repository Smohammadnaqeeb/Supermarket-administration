import os
import sqlite3
import mysql.connector
from mysql.connector import pooling
import logging
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Connection parameters with standard local development fallbacks
DB_HOST = os.getenv("DB_HOST", "")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_DATABASE = os.getenv("DB_DATABASE", "supermarket_db")

# Force SQLite if DB_TYPE is set to sqlite, or if host/user parameters are missing
FORCE_SQLITE = os.getenv("DB_TYPE", "mysql").lower() == "sqlite" or not DB_HOST or not DB_USER
USE_SQLITE = FORCE_SQLITE

connection_pool = None
SQLITE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "supermarket.db")

def init_pool():
    global connection_pool, USE_SQLITE
    if FORCE_SQLITE:
        logger.info("Forcing SQLite database configuration as requested.")
        USE_SQLITE = True
        return True

    try:
        connection_pool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name="supermarket_pool",
            pool_size=10,
            pool_reset_session=True,
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=int(DB_PORT),
            database=DB_DATABASE
        )
        logger.info("MySQL Connection Pool initialized successfully.")
        USE_SQLITE = False
        return True
    except mysql.connector.Error as err:
        logger.error(f"MySQL connection pool initialization failed: {err}")
        logger.info("Falling back to local SQLite database mode.")
        USE_SQLITE = True
        return True

# Initialize the pool / SQLite fallback mode at import
init_pool()

def get_connection():
    global connection_pool, USE_SQLITE
    if USE_SQLITE:
        # SQLite doesn't use the connection pool in the same way, we return a new sqlite connection
        conn = sqlite3.connect(SQLITE_FILE)
        conn.row_factory = sqlite3.Row
        return conn
        
    if not connection_pool:
        init_pool()
        if not connection_pool:
            raise mysql.connector.Error(msg="Database pool is not initialized.")
    
    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        logger.error(f"Failed to get connection from pool: {err}")
        raise err

def check_db_connection():
    """Test connection viability and return status + message"""
    global USE_SQLITE
    if USE_SQLITE:
        try:
            conn = sqlite3.connect(SQLITE_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchall()
            conn.close()
            return True, "SQLite database server is responsive."
        except Exception as e:
            return False, f"SQLite connection failure: {str(e)}"

    # MySQL pool check
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchall()
        return True, "Database server is responsive."
    except Exception as e:
        logger.error(f"MySQL database viability check failed: {e}")
        # Automatically toggle SQLite fallback if connection fails
        logger.info("Dynamically switching connection mode to local SQLite database.")
        USE_SQLITE = True
        return True, "Switched to local SQLite database fallback."
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass

def translate_query_for_sqlite(query):
    """Translates MySQL query placeholders and functions to SQLite syntax."""
    # 1. Replace placeholder %s with SQLite ?
    query = query.replace('%s', '?')
    
    # 2. Translate CURDATE() to date('now', 'localtime')
    query = query.replace('CURDATE()', "date('now', 'localtime')")
    
    # 3. Translate DATE_SUB(CURDATE(), INTERVAL 7 DAY) to date('now', '-7 days')
    query = query.replace("DATE_SUB(CURDATE(), INTERVAL 7 DAY)", "date('now', '-7 days')")
    
    # 4. Translate DATE_FORMAT(created_at, '%Y-%m-%d') to strftime('%Y-%m-%d', created_at)
    query = query.replace("DATE_FORMAT(created_at, '%Y-%m-%d')", "strftime('%Y-%m-%d', created_at)")
    
    return query

def execute_query(query, params=(), commit=False, dictionary=True):
    """
    Convenient wrapper to run SQL commands safely.
    Handles connection acquisition, cursor creation, execution, and release.
    """
    global USE_SQLITE
    if USE_SQLITE:
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            sql_query = translate_query_for_sqlite(query)
            cursor.execute(sql_query, params)
            
            if commit:
                conn.commit()
                lastrowid = cursor.lastrowid
                affected_rows = cursor.rowcount
                return {"lastrowid": lastrowid, "affected_rows": affected_rows}
            else:
                rows = cursor.fetchall()
                if dictionary:
                    return [dict(row) for row in rows]
                return rows
        except Exception as e:
            logger.error(f"SQLite database error: {e}")
            if conn and commit:
                conn.rollback()
            raise e
        finally:
            if cursor: cursor.close()
            if conn: conn.close()

    # MySQL connection execution
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=dictionary)
        cursor.execute(query, params)
        
        if commit:
            conn.commit()
            lastrowid = cursor.lastrowid
            affected_rows = cursor.rowcount
            return {"lastrowid": lastrowid, "affected_rows": affected_rows}
        else:
            result = cursor.fetchall()
            return result
    except mysql.connector.Error as err:
        logger.error(f"MySQL error during query execute: {err}")
        if conn and commit:
            conn.rollback()
        raise err
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def initialize_database():
    """
    Attempts to read schema.sql and create tables and seed default data.
    Automatically handles database creation.
    """
    global USE_SQLITE
    schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "schema.sql")
    if not os.path.exists(schema_path):
        logger.error(f"schema.sql not found at {schema_path}")
        return False, f"schema.sql not found at {schema_path}"

    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # Split schema statements
    statements = []
    current_statement = []
    for line in schema_sql.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("--") or trimmed.startswith("#"):
            continue
        current_statement.append(line)
        if trimmed.endswith(";"):
            statements.append("\n".join(current_statement))
            current_statement = []

    if USE_SQLITE:
        conn = None
        cursor = None
        try:
            conn = sqlite3.connect(SQLITE_FILE)
            cursor = conn.cursor()
            logger.info("Initializing SQLite database tables...")
            
            for stmt in statements:
                stmt_str = stmt.strip()
                if not stmt_str:
                    continue
                
                # Strip MySQL specific statements
                if "DROP DATABASE" in stmt_str or "CREATE DATABASE" in stmt_str or "USE " in stmt_str:
                    continue
                
                # Replace AUTO_INCREMENT with AUTOINCREMENT, ENUM with VARCHAR
                stmt_str = stmt_str.replace("AUTO_INCREMENT", "AUTOINCREMENT")
                stmt_str = re.sub(r"ENUM\([^)]+\)", "VARCHAR(30)", stmt_str)
                # Remove ENGINE and CHARSET parameters
                stmt_str = re.sub(r"ENGINE\s*=\s*\w+", "", stmt_str, flags=re.IGNORECASE)
                stmt_str = re.sub(r"DEFAULT\s+CHARSET\s*=\s*\w+", "", stmt_str, flags=re.IGNORECASE)
                # Remove TINYINT parameters or constraints
                stmt_str = stmt_str.replace("TINYINT(1)", "INTEGER")
                # Remove timestamp update parameters not supported in standard sqlite
                stmt_str = stmt_str.replace("ON UPDATE CURRENT_TIMESTAMP", "")
                
                cursor.execute(stmt_str)
            
            conn.commit()
            logger.info("SQLite database tables initialized successfully.")
            return True, "SQLite database initialized and seeded successfully."
        except Exception as e:
            logger.error(f"SQLite initialization failed: {e}")
            return False, f"SQLite init error: {str(e)}"
        finally:
            if cursor: cursor.close()
            if conn: conn.close()

    # MySQL Schema Seeding
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=int(DB_PORT)
        )
        cursor = conn.cursor()
        
        logger.info("Executing MySQL schema.sql...")
        for stmt in statements:
            stmt_str = stmt.strip()
            if stmt_str:
                cursor.execute(stmt_str)
        
        conn.commit()
        logger.info("MySQL database initialized successfully.")
        init_pool()
        return True, "MySQL database initialized and seeded successfully."
    except Exception as e:
        logger.error(f"MySQL database initialization failed: {e}")
        return False, str(e)
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
