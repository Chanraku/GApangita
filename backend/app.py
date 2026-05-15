from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
from datetime import timedelta
import mysql.connector
from flask_cors import CORS
import re
import secrets

app = Flask(__name__)
bcrypt = Bcrypt(app)

app.permanent_session_lifetime = timedelta(hours=2)

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_REFRESH_EACH_REQUEST'] = True

# Change to True in HTTPS production
app.config['SESSION_COOKIE_SECURE'] = False

app.secret_key = 'super_secret_key_for_local_use' # Change this in production
CORS(app, supports_credentials=True,
        origins=[
            "*"
        ])

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

def validate_csrf():
    token = request.headers.get('X-CSRF-Token')

    if not token:
        return False

    stored_token = session.get('csrf_token')

    if not stored_token:
        return False

    return secrets.compare_digest(token, stored_token)


@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM vw_categories")
        rows = cursor.fetchall()
        return jsonify(rows)

    finally:
        cursor.close()
        conn.close()

@app.route('/api/branches', methods=['GET'])
def get_branches():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM vw_branches")
        rows = cursor.fetchall()
        return jsonify(rows)

    finally:
        cursor.close()
        conn.close()
    

@app.route('/api/locations', methods=['GET'])
def get_locations():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM vw_locations")
        rows = cursor.fetchall()
        return jsonify(rows)

    finally:
        cursor.close()
        conn.close()

@app.route('/api/locations/by-branch/<branch_code>', methods=['GET'])
def get_locations_by_branch(branch_code):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT * FROM vw_branchLocations
            WHERE branch_code = %s
            ORDER BY NAME;
        """

        cursor.execute(query, (branch_code,))
        rows = cursor.fetchall()
        return jsonify(rows)

    finally:
        cursor.close()
        conn.close()

@app.route('/api/items', methods=['POST'])
def report_item():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401
    
    if not validate_csrf():
        return jsonify({'error': 'Invalid CSRF token'}), 403

    data = request.json

    # Never trust client for reporter identity. Use session user code.
    reporter_code = session.get('user_code')
    if not reporter_code:
        return jsonify({'error': 'Unauthorized. Missing user information.'}), 401

    # If client sent a reporter_user_id, log and ignore it
    if isinstance(data, dict) and data.get('reporter_user_id'):
        app.logger.warning('Ignored client-sent reporter_user_id: %s', data.get('reporter_user_id'))

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
            reporter_code
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
def search_openItems():
    name_q = request.args.get('name_q', '').strip()
    desc_q = request.args.get('desc_q', '').strip()
    q = request.args.get('q', '').strip()
    filter_itemType = request.args.get('filter', '').lower()

    limit = request.args.get('limit', 15, type=int)
    page = request.args.get('page', 1, type=int)

    # Prevent invalid pagination values
    if limit < 1:
        limit = 15

    if page < 1:
        page = 1

    offset = (page - 1) * limit

    category_id = request.args.get('category_id', '')
    branch_id = request.args.get('branch_id', '')
    location_id = request.args.get('location_id', '')
    
    if (not name_q and not desc_q and not category_id and not branch_id and not location_id):
        return jsonify({'items': [], 'total': 0, 'page': page, 'limit': limit})

    view_name = 'vw_openAllItems'
    if filter_itemType == 'lost':
        view_name = 'vw_openLostItems'
    elif filter_itemType == 'found':
        view_name = 'vw_openFoundItems'

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        base_query = f"SELECT * FROM {view_name} WHERE 1=1"
        count_query = f"SELECT COUNT(*) as total FROM {view_name} WHERE 1=1"

        params = []
        count_params = []

        # filters
        if category_id:
            base_query += " AND category_code = %s"
            count_query += " AND category_code = %s"
            params.append(category_id)
            count_params.append(category_id)

        if branch_id:
            base_query += " AND branch_code = %s"
            count_query += " AND branch_code = %s"
            params.append(branch_id)
            count_params.append(branch_id)

        if location_id:
            base_query += " AND location_code = %s"
            count_query += " AND location_code = %s"
            params.append(location_id)
            count_params.append(location_id)

        # total count (NO LIMIT!)
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']

        # pagination
        base_query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(base_query, params)
        items = cursor.fetchall()

        
        # Apply Levenshtein distance and convert to percentage similarity
        for item in items:
            sim_name = 0
            if name_q:
                dist_name = levenshtein_distance(name_q, item['name'])
                max_len_name = max(len(name_q), len(item['name']))
                sim_name = ((max_len_name - dist_name) / max_len_name * 100) if max_len_name > 0 else 0

            sim_desc = 0
            desc_str = item['description'] or ""
            if desc_q:
                dist_desc = levenshtein_distance(desc_q, desc_str)
                max_len_desc = max(len(desc_q), len(desc_str))
                sim_desc = ((max_len_desc - dist_desc) / max_len_desc * 100) if max_len_desc > 0 else 0
            
            item['name_relevance'] = round(sim_name) if name_q else None
            item['desc_relevance'] = round(sim_desc) if desc_q else None
            
            relevances = []
            if name_q: relevances.append(sim_name)
            if desc_q: relevances.append(sim_desc)
            item['relevance'] = round(max(relevances)) if relevances else 0
            
        # Sort by relevance (higher percentage is better)
        items.sort(key=lambda x: x['relevance'], reverse=True)
        
        return jsonify({
            "items": items,
            "total": total,
            "page": page,
            "limit": limit
        })
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

        #ONLY search by username
        query = """
            SELECT * FROM vw_userLogin
            WHERE username = %s
        """

        cursor.execute(query, (username,))
        user = cursor.fetchone()

        print(user)

        # Check if user exists AND password hash matches
        if user:
            # find the password-like field in the returned row safely
            stored_pw = None
            for key in user.keys():
                if 'pass' in key.lower():
                    stored_pw = user[key]
                    break

            if not stored_pw:
                return jsonify({'error': 'User record missing password field'}), 500

            if bcrypt.check_password_hash(stored_pw, password):
                session.permanent = True

                session['user_id'] = user['user_id']
                session['user_code'] = user['user_code']
                session['user_role'] = user['user_role']
                session['username'] = user['username']
                csrf_token = secrets.token_hex(32)
                session['csrf_token'] = csrf_token

                return jsonify({
                    'message': 'Logged in successfully',
                    'csrf_token': csrf_token,
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
        return jsonify({'error': 'Internal Server Error'}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()

        if 'conn' in locals() and conn.is_connected():
            conn.close()

@app.route('/api/logout', methods=['POST'])
def logout():

    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    if not validate_csrf():
        return jsonify({'error': 'Invalid CSRF token'}), 403
    
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
