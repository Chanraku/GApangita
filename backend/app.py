from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
import mysql.connector
from flask_cors import CORS
import re

app = Flask(__name__)
bcrypt = Bcrypt(app)

app.secret_key = 'super_secret_key_for_local_use' # Change this in production
CORS(app, supports_credentials=True)

# Database connection configuration
db_config = {
    'host': 'localhost',
    'user': 'gapangita_user',
    'password': 'Gapangita_Secure_123!',
    'database': 'gapangita_db_test'
}

MAX_DESCRIPTION_LENGTH = 1000
ALLOWED_ITEM_TYPES = ['lost', 'found']
USERNAME_REGEX = r'^[a-zA-Z0-9_]{3,20}$'

def get_db_connection():
    return mysql.connector.connect(**db_config)

def levenshtein_distance(s1, s2):
    s1, s2 = s1.lower(), s2.lower()
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

@app.route('/api/items', methods=['POST'])
def report_item():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401
    
    data = request.json

    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    item_type = data.get('item_type', '').lower().strip()

    # Validate required fields
    if not name:
        return jsonify({
            'error': 'Item name is required.'
        }), 400

    # Validate item type
    if item_type not in ALLOWED_ITEM_TYPES:
        return jsonify({
            'error': 'Invalid item type.'
        }), 400

    # Validate description length
    if len(description) > MAX_DESCRIPTION_LENGTH:
        return jsonify({
            'error': f'Description cannot exceed {MAX_DESCRIPTION_LENGTH} characters.'
        }), 400


    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            CALL sp_submit_report(%s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data.get('name'), data.get('description'), data.get('item_type'),
            data.get('category_id'), data.get('branch_id'), data.get('location_id'), 
            session.get('user_code') # Use logged in user's code
        )
        
        cursor.execute(query, values)
        conn.commit()
        return jsonify({'message': 'Item reported successfully', 'id': cursor.lastrowid}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()

@app.route('/api/search', methods=['GET'])
def search_items():
    query_str = request.args.get('q', '')
    filter_type = request.args.get('filter', '').lower()
    if not query_str:
        return jsonify([])

    view_name = 'vw_openAllItems'
    if filter_type == 'lost':
        view_name = 'vw_openLostItems'
    elif filter_type == 'found':
        view_name = 'vw_openFoundItems'

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"SELECT * FROM {view_name};")
        items = cursor.fetchall()
        
        # Apply Levenshtein distance and convert to percentage similarity
        for item in items:
            dist_name = levenshtein_distance(query_str, item['name'])
            max_len_name = max(len(query_str), len(item['name']))
            sim_name = ((max_len_name - dist_name) / max_len_name * 100) if max_len_name > 0 else 0

            desc_str = item['description'] or ""
            dist_desc = levenshtein_distance(query_str, desc_str)
            max_len_desc = max(len(query_str), len(desc_str))
            sim_desc = ((max_len_desc - dist_desc) / max_len_desc * 100) if max_len_desc > 0 else 0
            
            item['relevance'] = round(max(sim_name, sim_desc))
            
        # Sort by relevance (higher percentage is better)
        items.sort(key=lambda x: x['relevance'], reverse=True)
        
        return jsonify(items)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    # Username validation
    if not re.match(USERNAME_REGEX, username):
        return jsonify({
            'error': 'Invalid username format'
        }), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # ONLY search by username
        query = """
            SELECT user_id, user_code, user_role, username, password
            FROM users
            WHERE username = %s
        """

        cursor.execute(query, (username,))
        user = cursor.fetchone()

        # Check if user exists AND password hash matches
        if user and bcrypt.check_password_hash(user['password'], password):

            session['user_id'] = user['user_id']
            session['user_code'] = user['user_code']
            session['user_role'] = user['user_role']
            session['username'] = user['username']

            return jsonify({
                'message': 'Logged in successfully',
                'user': {
                    'user_id': user['user_id'],
                    'user_code': user['user_code'],
                    'user_role': user['user_role'],
                    'username': user['username']
                }
            }), 200

        return jsonify({
            'error': 'Invalid username or password'
        }), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()

        if 'conn' in locals() and conn.is_connected():
            conn.close()

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/auth-status', methods=['GET'])
def auth_status():
    if 'user_id' in session:
        return jsonify({
            'is_authenticated': True,
            'user': {
                'user_id': session['user_id'],
                'user_code': session['user_code'],
                'username': session['username']
            }
        }), 200
    return jsonify({'is_authenticated': False}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
