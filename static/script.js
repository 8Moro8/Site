document.addEventListener("DOMContentLoaded", async () => {
    const mainContainer = document.getElementById('main-container');
    const menuBtn = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
    const closeBtn = document.querySelector('.close-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const registerForm = document.getElementById('register-form');
    const addProductForm = document.getElementById('product-form');
    const openMessageBtn = document.querySelector('.open-message-btn');
    const modalOverlay = document.querySelector('.modal-overlay-add_product');
    const messageModal = document.querySelector('.message-modal');
    const closeMessageBtn = document.querySelector('.close-message-btn');
    const addProductModal = document.getElementById('add-item-modal');
    const closeAddProductModalBtn = document.getElementById('close-add_product-btn');
    const addProductBtn = document.getElementById('add-item-btn');
    const messageOverlay = document.querySelector('.message-overlay');

    // Хеширование пароля
    function hashPassword(password) {
        return CryptoJS.SHA256(password).toString();
    }

    // Регистрация пользователя
    async function registerUser(email, password, name, country, phone) {
        const hashedPassword = hashPassword(password);
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: hashedPassword, name, country, phone }),
        });
        const result = await response.json();
        alert(response.ok ? 'Регистрация успешна' : `Ошибка: ${result.error || 'Невозможно зарегистрировать пользователя'}`);
    }

    // Загрузка товаров
    async function loadProducts() {
        try {
            const response = await fetch('/get-products', { cache: 'no-cache' });
            if (!response.ok) throw new Error('Ошибка при загрузке товаров');

            const products = await response.json();

            const productsContainer = document.getElementById('products-container');
            productsContainer.innerHTML = products.map(product => `
                <div class="product-item">
                    <img src="${product.photo_url}" alt="${product.name}" />
                    <h3>${product.name}</h3>
                    <p>Цена: ${product.price}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка при загрузке товаров:', error);
        }
    }

    // Добавление товара
    addProductForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addProductForm);
        try {
            const response = await fetch('/add-product', { method: 'POST', body: formData });
            const result = await response.json();
            alert(response.ok ? 'Товар добавлен!' : `Ошибка: ${result.error}`);
            if (response.ok) {
                addProductModal.style.display = 'none';
                await loadProducts(); // Обновление списка товаров
            }
        } catch {
            alert('Ошибка при отправке.');
        }
    });

    // Проверка статуса пользователя
    function checkLoginStatus() {
        const loggedInUser = localStorage.getItem('loggedInUser');
        loggedInUser ? showMain() : showLogin();
    }

    function showMain() {
        mainContainer.style.display = 'block';
    }

    function showLogin() {
        window.location.href = 'reg.html';
    }

    // Выход пользователя
    function logout() {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'reg.html';
    }

    // Открытие и закрытие меню
    menuBtn?.addEventListener('click', () => menu.classList.add('active'));
    closeBtn?.addEventListener('click', () => menu.classList.remove('active'));

    // Модальные окна для сообщений
    openMessageBtn?.addEventListener('click', () => {
        messageOverlay.style.display = 'block';
        messageModal.style.display = 'block';
    });

    closeMessageBtn?.addEventListener('click', () => {
        messageOverlay.style.display = 'none';
        messageModal.style.display = 'none';
    });

    messageOverlay?.addEventListener('click', () => {
        messageOverlay.style.display = 'none';
        messageModal.style.display = 'none';
    });

    // Модальное окно для добавления товара
    addProductBtn?.addEventListener('click', () => {
        addProductModal.style.display = 'block';
    });

    closeAddProductModalBtn?.addEventListener('click', () => {
        addProductModal.style.display = 'none';
    });

    // Привязка обработчика к форме регистрации
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('name').value;
        const country = document.getElementById('country').value;
        const phone = document.getElementById('phone').value;
        await registerUser(email, password, name, country, phone);
    });

    // Привязка обработчика к кнопке выхода
    logoutBtn?.addEventListener('click', logout);

    // Инициализация
    await loadProducts(); // Загрузка товаров при загрузке страницы
    checkLoginStatus();
});
