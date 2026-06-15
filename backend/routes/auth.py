import os
from flask import Blueprint, request, jsonify, g
from functools import wraps
from werkzeug.security import check_password_hash
from database.connection import execute_query
from itsdangerous import URLSafeTimedSerializer

auth_bp = Blueprint('auth', __name__)

SECRET_KEY = os.getenv("SECRET_KEY", "supermarket_secret_key_2026")
serializer = URLSafeTimedSerializer(SECRET_KEY)

def login_required(f):
    """Decorator to restrict access to authenticated API clients with valid Bearer tokens."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Access token is missing or invalid."}), 401
        
        token = auth_header.split(" ")[1]
        try:
            # Token expires after 24 hours (86400 seconds)
            data = serializer.loads(token, max_age=86400)
            g.user_id = data["user_id"]
            g.role = data["role"]
            g.username = data["username"]
            g.full_name = data["full_name"]
        except Exception:
            return jsonify({"success": False, "message": "Session expired or invalid token."}), 401
            
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to restrict access to administrator users only."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Access token is missing or invalid."}), 401
        
        token = auth_header.split(" ")[1]
        try:
            data = serializer.loads(token, max_age=86400)
            g.user_id = data["user_id"]
            g.role = data["role"]
            g.username = data["username"]
            g.full_name = data["full_name"]
        except Exception:
            return jsonify({"success": False, "message": "Session expired or invalid token."}), 401
            
        if g.role != 'admin':
            return jsonify({"success": False, "message": "Access Denied. Admin privilege required."}), 403
            
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Request payload must be JSON."}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({"success": False, "message": "Please enter both username and password."}), 400

    try:
        users = execute_query(
            "SELECT * FROM users WHERE username = %s AND is_active = 1",
            (username,)
        )

        if users and check_password_hash(users[0]['password_hash'], password):
            user = users[0]
            # Generate JWT token payload
            token = serializer.dumps({
                "user_id": user['id'],
                "role": user['role'],
                "username": user['username'],
                "full_name": user['full_name']
            })

            return jsonify({
                "success": True,
                "message": "Login successful.",
                "token": token,
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "role": user['role'],
                    "full_name": user['full_name'],
                    "email": user['email']
                }
            })
        else:
            return jsonify({"success": False, "message": "Invalid username or password."}), 401
    except Exception as e:
        return jsonify({"success": False, "message": f"Database query failure: {str(e)}"}), 500

@auth_bp.route('/api/auth/me', methods=['GET'])
@login_required
def me():
    """Validates active Bearer Token and returns current user details."""
    return jsonify({
        "success": True,
        "user": {
            "id": g.user_id,
            "username": g.username,
            "role": g.role,
            "full_name": g.full_name
        }
    })
