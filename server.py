import bcrypt
from supabase import create_client
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename  # Добавьте импорт
import os
import logging
import tempfile

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Настройки Supabase (переменные окружения)
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://mmlykvajpysgizmspxwd.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbHlrdmFqcHlzZ2l6bXNweHdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjYyNzM3MiwiZXhwIjoyMDQ4MjAzMzcyfQ.6uy28LJVPYNSxvrA92nhjE9EoJg_H7Im-EgfcFsZMcA')  # Лучше использовать файл .env
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.after_request
def add_cors_and_iframe_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5000'  # Укажите нужный домен
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['X-Frame-Options'] = 'ALLOW-FROM http://localhost:5000'
    response.headers['Content-Security-Policy'] = "frame-ancestors 'self' http://localhost:5000"
    return response

@app.route('/set_cookie')
def set_cookie():
    resp = make_response("Кука установлена")
    resp.set_cookie('example', 'value', samesite='None', secure=True)
    return resp

@app.route('/')
def home():
    return send_from_directory('templates', 'index.html')

@app.route('/reg.html')
def reg():
    return send_from_directory('templates', 'reg.html')

@app.route('/index.html')
def index():
    return send_from_directory('templates', 'index.html')

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
    products_services = supabase.table('products_services').select('*').execute()
    return jsonify(products_services.data), 200

# Загрузка файла
@app.route('/add-product', methods=['POST'])
def add_product():
    try:
        name = request.form['name']
        price = request.form['price']
        is_service = request.form['is_service']
        file = request.files['photo']

        # Логирование входных данных для отладки
        logging.debug(f"Received data: name={name}, price={price}, is_service={is_service}, filename={file.filename}")

        # Генерация безопасного и уникального имени файла
        filename = secure_filename(file.filename)
        unique_filename = f"{os.urandom(16).hex()}_{filename}"
        
        # Чтение содержимого файла
        file_content = file.read()

        # Загрузка файла в Supabase Storage
        response = supabase.storage.from_("8").upload(
            f"products/{unique_filename}", file_content
        )

        # Логирование ответа
        logging.debug(f"Response from upload: {response}")

        # Проверка успешности загрузки файла
        if response.path:
            url = f"{SUPABASE_URL}/storage/v1/object/public/8/products/{unique_filename}"

            # Сохранение данных в таблицу products_services
            data = supabase.table("products_services").insert({
                "name": name,
                "price": price,
                "is_service": is_service.lower() == "true",
                "photo_url": url
            }).execute()

            return {"message": "Продукт добавлен успешно", "data": data.data}, 201
        else:
            # Логирование ошибки загрузки
            logging.error(f"Ошибка при загрузке файла: {response}")
            return {"error": "Ошибка загрузки файла"}, 400

    except Exception as e:
        # Логирование исключений
        logging.error(f"Ошибка: {e}")
        return {"error": "Произошла ошибка на сервере"}, 500

@app.route('/get-products', methods=['GET'])
def get_products():
    try:
        products = supabase.table('products_services').select('*').execute()
        return jsonify(products.data), 200
    except Exception as e:
        logging.error(f"Ошибка при получении продуктов: {e}")
        return jsonify({"error": "Не удалось получить продукты"}), 500

if __name__ == '__main__':
    app.run(debug=True)
