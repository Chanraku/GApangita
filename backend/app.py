from flask import Flask, request, jsonify
import mysql.connector
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database connection configuration
db_config = {
    'host': 'localhost',
    'user': 'gapangita_user',
    'password': 'Gapangita_Secure_123!',
    'database': 'gapangita_db_TEST'
}

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
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            CALL sp_submit_report(%s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data.get('name'), data.get('description'), data.get('item_type'),
            data.get('category_id'), data.get('branch_id'), data.get('location_id'), data.get('reporter_user_id')
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
    if not query_str:
        return jsonify([])

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vw_openItems")
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
