// Ждем, пока DOM полностью загрузится
document.addEventListener("DOMContentLoaded", function() {
    // Получаем элементы из DOM
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const mainContainer = document.getElementById('main-container');
    const homeLink = document.getElementById('homeLink');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerBtn = document.getElementById('register-btn');
    const backToLoginBtn = document.getElementById('back-to-login');

    // Получаем элементы кнопок и меню
    const menuBtn = document.querySelector('.menu-btn');
    const menu = document.querySelector('.menu');
    const closeBtn = document.querySelector('.close-btn');

    // Получаем элементы для навигации
    const aboutLink = document.getElementById('about-link');
    const contactLink = document.getElementById('contact-link');

    // Массив для хранения пользователей
    let users = [];

    // Загрузка пользователей из localStorage при инициализации
    function loadUsers() {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        } else {
            // Пример добавления тестового пользователя, если нет данных
            users.push({
                username: "testUser",
                email: "test@example.com",
                country: "Казахстан",
                phone: "+7 (777) 123-45-67",
                password: "password123" // Здесь лучше хэшировать пароль
            });
            saveUsers(); // Сохранение тестового пользователя
        }
    }

    // Сохранение пользователей в localStorage
    function saveUsers() {
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Функция для отображения окна авторизации
    function showLogin() {
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
        mainContainer.style.display = 'none';
    }

    // Функция для отображения окна регистрации
    function showRegister() {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
        mainContainer.style.display = 'none';
    }

    // Функция для отображения главной страницы
    function showMain() {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'none';
        mainContainer.style.display = 'block';
    }

    // Обработчики событий для кнопок меню
    if (homeLink) {
        homeLink.addEventListener('click', (event) => {
            event.preventDefault();
            showMain(); // Показываем главную страницу
        });
    }

    if (aboutLink) {
        aboutLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'about.html'; // Переход на страницу "О нас"
        });
    }

    if (contactLink) {
        contactLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'contacts.html'; // Переход на страницу "Контакты"
        });
    }

    // Обработчик события для кнопки меню
    menuBtn.addEventListener('click', () => {
        menu.style.left = '0'; // Показать меню
    });

    // Обработчик события для кнопки закрытия
    closeBtn.addEventListener('click', () => {
        menu.style.left = '-250px'; // Скрыть меню
    });

    // Слушатели событий для регистрации и возврата к авторизации
    registerBtn.addEventListener('click', showRegister);
    backToLoginBtn.addEventListener('click', showLogin);

    // Обработка регистрации
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        // Валидация
        const username = document.getElementById("reg-username").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const country = document.getElementById("reg-country").value.trim();
        const phone = document.getElementById("reg-phone").value.trim();
        const password = document.getElementById("reg-password").value;

        // Проверка на заполнение всех полей
        if (username === "" || email === "" || country === "" || phone === "" || password === "") {
            alert("Все поля должны быть заполнены!");
            return;
        }

        // Проверка формата email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert("Введите корректный адрес электронной почты!");
            return;
        }

        // Проверка на уникальность имени пользователя или email
        const userExists = users.some(user => user.username === username || user.email === email);
        if (userExists) {
            alert("Пользователь с таким именем или email уже существует!");
            return;
        }

        // Хэширование пароля
        const hashedPassword = await hashPassword(password);

        // Сохранение нового пользователя
        users.push({
            username: username,
            email: email,
            country: country,
            phone: phone,
            password: hashedPassword // Храните только хэш пароля
        });

        // Сохранение пользователей в localStorage
        saveUsers();

        registerContainer.style.display = "none";
        loginContainer.style.display = "block";
        alert("Регистрация прошла успешно! Теперь можно авторизоваться.");
    });

    // Обработка авторизации
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const loginIdentifier = document.getElementById("login-identifier").value.trim();
        const password = document.getElementById("password").value;

        // Проверка пользователя по никнейму или почте
        const user = users.find(user =>
            (user.username === loginIdentifier || user.email === loginIdentifier) && user.password === password
        );

        if (user) {
            loginContainer.style.display = "none";
            mainContainer.style.display = "block";
        } else {
            alert("Неверные данные для входа!");
        }
    });

    // Инициализация страницы
    loadUsers(); // Загрузить пользователей при загрузке
    showLogin(); // Показать окно авторизации при загрузке
});

// Пример кода для хэширования паролей (потребуется серверная часть для работы с библиотекой bcrypt)
async function hashPassword(password) {
    const hashedPassword = await bcrypt.hash(password, 10); // 10 - количество раундов хэширования
    return hashedPassword;
}
