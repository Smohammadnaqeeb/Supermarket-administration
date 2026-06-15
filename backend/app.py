import os
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load configurations from dotenv file
load_dotenv()

# Import Blueprints
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.products import products_bp
from routes.billing import billing_bp
from routes.inventory import inventory_bp
from routes.reports import reports_bp

# Import DB utilities
from database.connection import check_db_connection, initialize_database, DB_HOST, DB_USER, DB_PORT, DB_DATABASE

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "supermarket_secret_key_2026")

# Enable Cross-Origin Resource Sharing (CORS)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(products_bp)
app.register_blueprint(billing_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(reports_bp)

_db_last_check_time = 0.0
_db_last_check_result = (True, "Database server is responsive.")

@app.before_request
def enforce_database_connection():
    """
    Middleware that intercepts requests to ensure the database is responsive.
    Allows setup/diagnostic endpoints to load.
    """
    allowed_paths = [
        '/api/db-setup/status',
        '/api/db-setup/initialize'
    ]
    
    # Check if the current request path matches setup paths
    if request.path in allowed_paths:
        return None
        
    # Check database viability with 3-second caching
    global _db_last_check_time, _db_last_check_result
    now = time.time()
    if now - _db_last_check_time > 3.0:
        _db_last_check_result = check_db_connection()
        _db_last_check_time = now
        
    db_responsive, error_msg = _db_last_check_result
    if not db_responsive:
        return jsonify({
            'success': False,
            'responsive': False,
            'error': 'Database server is offline or tables are missing.',
            'details': error_msg
        }), 503

@app.route('/api/db-setup/status', methods=['GET'])
def db_status():
    """Diagnostic setup endpoint to check connection parameters."""
    db_responsive, error_msg = check_db_connection()
    
    db_config = {
        'host': DB_HOST,
        'user': DB_USER,
        'port': DB_PORT,
        'database': DB_DATABASE,
        'responsive': db_responsive,
        'error': error_msg if not db_responsive else ''
    }
    
    return jsonify({
        'success': True,
        'responsive': db_responsive,
        'config': db_config
    })

@app.route('/api/db-setup/initialize', methods=['POST'])
def run_db_initialization():
    """Triggers execution of schema.sql to seed the database."""
    success, message = initialize_database()
    return jsonify({
        'success': success,
        'message': message
    })

@app.errorhandler(404)
def page_not_found(e):
    return jsonify({'success': False, 'error': 'Endpoint not found.'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'success': False, 'error': 'Internal server error occurred.'}), 500

if __name__ == '__main__':
    app_port = int(os.getenv("PORT", 5000))
    app_debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    
    print("-------------------------------------------------------------")
    print("      Supermarket Billing System Backend API Server Running  ")
    print("-------------------------------------------------------------")
    app.run(host='0.0.0.0', port=app_port, debug=app_debug)
