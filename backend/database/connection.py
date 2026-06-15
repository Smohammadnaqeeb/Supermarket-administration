import os
import mysql.connector
from mysql.connector import pooling
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Connection parameters with standard local development fallbacks
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_DATABASE = os.getenv("DB_DATABASE", "supermarket_db")

connection_pool = None

def init_pool():
    global connection_pool
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
        return True
    except mysql.connector.Error as err:
        logger.error(f"Error initializing MySQL Connection Pool: {err}")
        # Try initializing pool without database if database doesn't exist yet
        try:
            connection_pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="supermarket_pool",
                pool_size=5,
                pool_reset_session=True,
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                port=int(DB_PORT)
            )
            logger.info("MySQL Connection Pool initialized without specific database select.")
            return True
        except mysql.connector.Error as pool_err:
            logger.error(f"Error initializing MySQL connection pool without database: {pool_err}")
            connection_pool = None
            return False

# Initialize the pool at import
init_pool()

def get_connection():
    global connection_pool
    if not connection_pool:
        if not init_pool():
            raise mysql.connector.Error(msg="Database pool is not initialized and connection failed.")
    
    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        logger.error(f"Failed to get connection from pool: {err}")
        raise err

def check_db_connection():
    """Test connection viability using the pool and return status + message"""
    global connection_pool
    conn = None
    cursor = None
    try:
        if not connection_pool:
            init_pool()
        if connection_pool:
            conn = connection_pool.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchall()  # Exhaust the result set
            return True, "Database server is responsive."
    except Exception as e:
        logger.error(f"Database connection pool viability check failed: {e}")
        # Try direct connection as fallback
        try:
            direct_conn = mysql.connector.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                port=int(DB_PORT)
            )
            if direct_conn.is_connected():
                direct_conn.close()
                return True, "Database server is responsive."
        except Exception as direct_err:
            return False, str(direct_err)
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close() # Return connection to the pool
            except Exception:
                pass
    return False, "Unknown connection failure."

def execute_query(query, params=(), commit=False, dictionary=True):
    """
    Convenient wrapper to run SQL commands safely.
    Handles connection acquisition, cursor creation, execution, and release.
    """
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
        logger.error(f"Database error during query execute: {err}")
        if conn and commit:
            conn.rollback()
        raise err
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def initialize_database():
    """
    Attempts to read schema.sql and create tables and seed default data.
    Automatically handles database creation.
    """
    conn = None
    cursor = None
    try:
        # Connect directly without specifying database to ensure we can create it
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=int(DB_PORT)
        )
        cursor = conn.cursor()
        
        # Read schema file
        schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "schema.sql")
        if not os.path.exists(schema_path):
            logger.error(f"schema.sql not found at {schema_path}")
            return False, f"schema.sql not found at {schema_path}"
            
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        logger.info("Executing schema.sql...")
        # Split schema by semicolon, handling comments and empty statements robustly
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

        for stmt in statements:
            stmt_str = stmt.strip()
            if stmt_str:
                cursor.execute(stmt_str)
        
        conn.commit()
        logger.info("Database and tables initialized and seeded successfully.")
        
        # Re-initialize pool now that database exists
        init_pool()
        return True, "Database initialized and seeded successfully."
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
