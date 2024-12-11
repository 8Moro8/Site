import bcrypt
from supabase import create_client
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import logging

app = Flask(__name__)
CORS(app, supports_credentials=True)

SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://mmlykvajpysgizmspxwd.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbHlrdmFqcHlzZ2l6bXNweHdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjYyNzM3MiwiZXhwIjoyMDQ4MjAzMzcyfQ.6uy28LJVPYNSxvrA92nhjE9EoJg_H7Im-EgfcFsZMcA')  # Лучше использовать файл .env
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.after_request
def add_cors_and_iframe_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5000'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['X-Frame-Options'] = 'ALLOW-FROM http://localhost:5000'
    response.headers['Content-Security-Policy'] = "frame-ancestors 'self' http://localhost:5000"
    return response

@app.route('/set_cookie')
def set_cookie():
    resp = make_response("Куки установлены")
    resp.set_cookie('example', 'value', samesite='None', secure=True)
    return resp

@app.route('/')
def home():
    return send_from_directory('', 'index.html')

@app.route('/reg.html')
def reg():
    return send_from_directory('templates', 'reg.html')

@app.route('/index.html')
def index():
    return send_from_directory('', 'index.html')

@app.route('/about.html')
def about():
    return send_from_directory('templates', 'about.html')

@app.route('/packages.html')
def packages():
    return send_from_directory('templates', 'packages.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')

    existing_user = supabase.table('users').select('*').eq('email', email).execute()
    if existing_user.data:
        return jsonify({'error': 'Email уже зарегистрирован'}), 400

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    supabase.table('users').insert({
        'email': email,
        'password_hash': password_hash.decode('utf-8'),
        'username': username
    }).execute()

    return jsonify({'message': 'Пользователь зарегистрирован'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    response = supabase.table('users').select('*').eq('email', email).execute()
    if not response.data:
        return jsonify({"error": "Пользователь не найден"}), 404

    user = response.data[0]
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({"error": "Неверный пароль"}), 401

    return jsonify({"message": "Успешный вход", "user": {"email": user["email"], "username": user["username"]}}), 200

@app.route('/products_services', methods=['GET'])
def get_products_services():
    try:
        products_services = supabase.table('products_services').select('*').execute()
        return jsonify(products_services.data), 200
    except Exception as e:
        logging.error(f"Ошибка при получении продуктов: {e}")
        return jsonify({"error": "Не удалось получить продукты"}), 500

@app.route('/add-product', methods=['POST'])
def add_product():
    try:
        name = request.form['name']
        price = request.form['price']
        is_service = request.form['is_service'].lower() in ['true', '1', 'yes']
        file = request.files['photo']

        filename = secure_filename(file.filename)
        unique_filename = f"{os.urandom(16).hex()}_{filename}"
        
        file_content = file.read()

        response = supabase.storage.from_("8").upload(
            f"products/{unique_filename}", file_content
        )

        if hasattr(response, 'error') and response.error:
            logging.error(f"Ошибка при загрузке файла: {response.error}")
            return jsonify({"error": "Ошибка загрузки файла"}), 400

        url = f"{SUPABASE_URL}/storage/v1/object/public/8/products/{unique_filename}"

        data = supabase.table("products_services").insert({
            "name": name,
            "price": price,
            "is_service": is_service,
            "photo_url": url,
            "description": request.form.get('description', '')
        }).execute()

        return jsonify({"message": "Продукт добавлен успешно", "data": data.data}), 201

    except Exception as e:
        logging.error(f"Ошибка: {e}")
        return jsonify({"error": "Произошла ошибка на сервере"}), 500
    
@app.route('/get-product-info/<int:product_id>', methods=['GET'])
def get_product_info(product_id):
    product = find_product_in_db(product_id)
    if not product:
        return jsonify({'error': "Продукт не найден"}), 404
    return jsonify(product)

@app.route('/delete-product/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        product = find_product_in_db(product_id)
        if not product:
            return jsonify({"error": "Продукт не найден"}), 404

        response = supabase.table('products_services').delete().eq('id', product_id).execute()

        if response.data:
            return jsonify({"message": "Продукт удален успешно"}), 200
        else:
            return jsonify({"error": "Ошибка при удалении товара"}), 400

    except Exception as e:
        logging.error(f"Ошибка при удалении товара: {e}")
        return jsonify({"error": "Произошла ошибка на сервере"}), 500

@app.route('/buy-product/<int:product_id>', methods=['POST'])
def buy_product(product_id):
    try:
        product = supabase.table("products_services").select("*").eq("id", product_id).execute()

        if not product.data:
            return jsonify({"error": "Товар не найден"}), 404
        
        update_response = supabase.table("products_services").update({
            "status": "sold"
        }).eq("id", product_id).execute()

        if hasattr(update_response, 'error') and update_response.error:
            return jsonify({"error": "Ошибка при обновлении статуса товара"}), 500

        return jsonify({"message": "Товар успешно куплен", "product": product.data}), 200

    except Exception as e:
        logging.error(f"Ошибка: {e}")
        return jsonify({"error": "Произошла ошибка на сервере"}), 500


def buy_product_from_db(product_id):
    try:
        product = find_product_in_db(product_id)

        if not product:
            return False

        if product.get('status') == 'sold':
            return False

        response = supabase.table('products_services').update({
            'status': 'sold'
        }).eq('id', product_id).execute()

        if response.status == 200:
            return True
        return False

    except Exception as e:
        logging.error(f"Ошибка при покупке товара: {e}")
        return False


def find_product_in_db(product_id):
    response = supabase.table('products_services').select('*').eq('id', product_id).execute()
    
    if response.data:
        return response.data[0]
    return None

@app.route('/send-message', methods=['POST'])
def send_message():
    try:
        data = request.get_json()
        message = data.get('message')
        if not message:
            return jsonify({"status": "Ошибка: сообщение не задано"}), 400
        
        return jsonify({"status": "Сообщение отправлено!"}), 200
    except Exception as e:
        return jsonify({"status": f"Ошибка: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
