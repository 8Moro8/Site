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
    const addProductModal = document.getElementById('add-item-modal');
    const closeAddProductModalBtn = document.getElementById('close-add_product-btn');
    const addProductBtn = document.getElementById('add-item-btn');
    const productInfoModal = document.getElementById('product-info-modal');
    const closeInfoBtn = document.getElementById('close-info-btn');
    const deleteProductBtn = document.getElementById('delete-product-btn');
    const buyProductBtn = document.getElementById('buy-product-btn');
    const productsContainer = document.getElementById('products-container');
    const messageOverlay = document.querySelector('.message-overlay');
    const messageModal = document.querySelector('.message-modal');
    const messageInput = document.querySelector('.message-input');
    const sendMessageBtn = document.querySelector('.send-message-btn');
    const closeMessageBtn = document.querySelector('.close-message-btn');
    const messageNotification = document.querySelector('.message-notification');

    // Функция для покупки товара
    const buyProduct = async (productId) => {
        try {
            // Запрос разрешения на уведомления, если оно не было предоставлено
            if (Notification.permission !== "granted") {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    alert('Разрешение на уведомления не предоставлено.');
                    return;
                }
            }

            const response = await fetch(`/buy-product/${productId}`, { method: 'POST' });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);  // Показываем сообщение о успешной покупке

                // Показываем системное уведомление
                if (Notification.permission === "granted") {
                    new Notification("Успешная покупка!", {
                        body: `Вы успешно купили товар ${data.productName}`,
                        icon: 'static/free-icon-black-check-box-with-white-check-61141.png'
                    });
                }

                // Деактивируем кнопку "Купить товар"
                buyProductBtn.disabled = true;
                buyProductBtn.innerText = "Товар куплен";

                // Обновить состояние товара в интерфейсе
                // Например, скрыть этот товар или обновить его статус
                const productItem = document.querySelector(`[data-id="${productId}"]`);
                if (productItem) {
                    productItem.querySelector('.buy-product-btn').disabled = true;
                    productItem.querySelector('.buy-product-btn').innerText = "Товар куплен";
                }
            } else {
                const data = await response.json();
                alert(data.error || 'Ошибка при покупке товара');
            }
        } catch (error) {
        }
    };

    // Обработчик клика по кнопке "Купить товар" в модальном окне
    buyProductBtn?.addEventListener('click', () => {
        const productId = buyProductBtn.dataset.id;
        if (productId) {
            buyProduct(productId);
        }
    });

    // Загрузка товаров
    async function loadProducts() {
        try {
            const response = await fetch('/products_services', { cache: 'no-cache' });
            if (!response.ok) throw new Error('Ошибка при загрузке товаров');
            const products = await response.json();
            
            productsContainer.innerHTML = products.map(product => `
                <div class="product-item" data-id="${product.id}">
                    <img src="${product.photo_url || 'path/to/default/image.jpg'}" alt="${product.name}" />
                    <h3>${product.name}</h3>
                    <p>Цена: ${product.price}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка при загрузке товаров:', error);
        }
    }

    // Открытие модального окна с информацией о товаре
    productsContainer?.addEventListener('click', async (e) => {
        const productItem = e.target.closest('.product-item');
        if (!productItem) return; // проверка на то, что клик был по элементу товара
        const productId = productItem.dataset.id;
        
        try {
            const response = await fetch(`/get-product-info/${productId}`);
            if (!response.ok) throw new Error('Ошибка при получении информации о товаре');
            const product = await response.json();
    
            document.getElementById('product-info-name').innerText = product.name || 'Нет данных';
            document.getElementById('product-info-description').innerText = product.description || 'Нет описания';
            document.getElementById('product-info-price').innerText = product.price || 'Нет цены';
            document.getElementById('product-info-image').src = product.photo_url || 'path/to/default/image.jpg';
    
            productInfoModal.style.display = 'block';
            buyProductBtn.disabled = product.status === 'sold';
            buyProductBtn.dataset.id = product.id;

            if (buyProductBtn) {
                buyProductBtn.dataset.id = product.id;
                buyProductBtn.style.display = product.status === 'sold' ? 'none' : 'inline-block';
            }
    
            if (deleteProductBtn) {
                deleteProductBtn.dataset.id = product.id;
            }
        } catch (error) {
            alert('Ошибка при загрузке информации о товаре');
        }
    });
    

    // Обработчик клика по кнопке "Купить товар" в модальном окне
    buyProductBtn?.addEventListener('click', () => {
        const productId = buyProductBtn.dataset.id;
        if (productId) {
            buyProduct(productId);
        }
    });

    // Закрытие модального окна с информацией о товаре
    closeInfoBtn?.addEventListener('click', () => {
        productInfoModal.style.display = 'none';
    });

    // Удаление товара
    deleteProductBtn?.addEventListener('click', async () => {
        const productId = deleteProductBtn.dataset.id;
        const response = await fetch(`/delete-product/${productId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Товар удален!');
            productInfoModal.style.display = 'none';
            await loadProducts();
        } else {
            alert('Ошибка при удалении товара');
        }
    });

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
                await loadProducts();
            }
        } catch {
            alert('Ошибка при отправке.');
        }
    });

    // Выход пользователя
    logoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'reg.html';
    });

    // Открытие и закрытие меню
    menuBtn?.addEventListener('click', () => menu.classList.add('active'));
    closeBtn?.addEventListener('click', () => menu.classList.remove('active'));

    // Открытие окна сообщений
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

    // Открытие модального окна добавления товара
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

    // Проверка статуса пользователя
    function checkLoginStatus() {
        const loggedInUser = localStorage.getItem('loggedInUser');
        loggedInUser ? mainContainer.style.display = 'block' : window.location.href = 'reg.html';
    }

    const sendMessage = () => {
        const messageText = messageInput.value.trim();
        
        if (messageText === '') {
            alert('Пожалуйста, введите сообщение.');
            return;
        }

        // Очистить поле ввода
        messageInput.value = '';

        // Отправка сообщения
        fetch('/send-message', {
            method: 'POST',
            body: JSON.stringify({ message: messageText }),
            headers: { 'Content-Type': 'application/json' }
        }).then(response => response.json())
          .then(data => {
              alert(data.status);
              messageNotification.style.display = 'block';
          })
          .catch(error => alert('Ошибка при отправке сообщения.'));
    };

    sendMessageBtn?.addEventListener('click', sendMessage);

    // Загрузка товаров при загрузке страницы
    loadProducts();
    checkLoginStatus();
});
