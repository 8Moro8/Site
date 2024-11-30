// Переход между окнами авторизации и регистрации
document.getElementById('register-btn').addEventListener('click', function() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
});

document.getElementById('back-to-login').addEventListener('click', function() {
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
});

// Обработчик для формы авторизации
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let identifier = document.getElementById('login-identifier').value;
    let password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: identifier, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Успешный вход') {
            // Сохраняем данные о пользователе в localStorage
            localStorage.setItem('loggedInUser', JSON.stringify(data.user));
            // Редирект на главную страницу после успешного входа
            window.location.href = 'index.html'; 
        } else {
            alert(data.error);  // Показываем ошибку, если что-то пошло не так
        }
    })
    .catch(error => alert('Ошибка связи с сервером'));  // Обработка ошибки сети
});

// Обработчик для формы регистрации
document.getElementById('register-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const country = document.getElementById('reg-country').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;

    // Отправка данных на сервер для регистрации пользователя
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username, country, phone })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Пользователь зарегистрирован') {
            alert('Регистрация успешна');
            // Переход обратно на страницу авторизации после успешной регистрации
            document.getElementById('register-container').style.display = 'none';
            document.getElementById('login-container').style.display = 'block';
        } else {
            alert(`Ошибка: ${data.error}`);  // Показываем ошибку регистрации
        }
    })
    .catch(error => alert('Ошибка связи с сервером'));  // Обработка ошибки сети
});
