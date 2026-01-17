import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBMAds5kqj8BUzOP2OaimC12wUqfkLs9oE",
    authDomain: "taveine-admin.firebaseapp.com",
    projectId: "taveine-admin",
    storageBucket: "taveine-admin.firebasestorage.app",
    messagingSenderId: "916085731146",
    appId: "1:916085731146:web:764187ed408e8c4fdfdbb3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tg = window.Telegram?.WebApp;

let products = [];
let cart = JSON.parse(localStorage.getItem('taveine_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('taveine_wishlist')) || [];

async function init() {
    if (tg) {
        tg.expand();
        tg.ready();
        tg.MainButton.setText('Continue Shopping').show();
    }

    console.log("Начало загрузки продуктов...");

    // Пробуем загрузить из Firebase
    try {
        const snapshot = await getDocs(collection(db, "products"));
        products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            price: parseFloat(doc.data().price) || 0
        }));

        if (products.length > 0) {
            console.log("Продукты успешно загружены из Firebase:", products.length, "шт");
        } else {
            console.warn("Firebase вернул пустой список продуктов");
        }
    } catch (e) {
        console.error("Ошибка загрузки из Firebase:", e.message);
    }

    // Если продуктов нет — используем демо (fallback)
    if (products.length === 0) {
        console.log("Используем демо-продукты (fallback)");
        products = [
            {
                id: 'demo1',
                name: 'Eternal Rose Bouquet',
                price: 299,
                image: 'https://via.placeholder.com/300x400/ff69b4/ffffff?text=Eternal+Rose',
                description: 'Вечные розы премиум-класса',
                tags: ['luxury', 'bestseller', 'forever']
            },
            {
                id: 'demo2',
                name: 'Spring Blossom',
                price: 149,
                image: 'https://via.placeholder.com/300x400/90ee90/000?text=Spring',
                description: 'Нежный весенний букет',
                tags: ['spring', 'new']
            },
            {
                id: 'demo3',
                name: 'Crystal Vase Set',
                price: 220,
                image: 'https://via.placeholder.com/300x400/add8e6/000?text=Vase',
                description: 'Композиция в хрустальной вазе',
                tags: ['vases']
            },
            {
                id: 'demo4',
                name: 'Forever Rose Dome',
                price: 450,
                image: 'https://via.placeholder.com/300x400/ffb6c1/000?text=Forever',
                description: 'Вечная роза под куполом',
                tags: ['forever', 'luxury']
            },
            {
                id: 'demo5',
                name: 'Luxury Orchid Box',
                price: 380,
                image: 'https://via.placeholder.com/300x400/4b0082/fff?text=Specialty',
                description: 'Экзотическая орхидея в подарочной коробке',
                tags: ['specialty', 'luxury']
            },
            {
                id: 'demo6',
                name: 'Romantic Balloons & Roses',
                price: 195,
                image: 'https://via.placeholder.com/300x400/ffb6c1/000?text=Balloons',
                description: 'Розы + воздушные шары',
                tags: ['balloons']
            }
        ];
    }

    console.log("Итого продуктов перед рендером:", products.length);

    // Принудительно рендерим главную страницу
    renderMainPage();
    updateBadges();
    setupEventListeners();

    console.log("Инициализация завершена — продукты должны отображаться");
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const results = products.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
            renderSearchResults(results);
        });
    }
    // Wishlist page rendering
    document.getElementById('wish-container').innerHTML = renderWishlistItems();
  
    // Cart page rendering
    document.getElementById('cart-container').innerHTML = renderCartItems();
}

function renderProductCard(p) {
    const inWishlist = wishlist.some(item => item.id === p.id);
    const wishIcon = inWishlist
        ? `<svg viewBox="0 0 24 24" fill="currentColor" class="wish-filled"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="wish-empty"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

    return `
        <div class="uniform-card" onclick="openProductDetail('${p.id}')">
            <button class="wish-btn-overlay" onclick="event.stopPropagation(); toggleWishlist('${p.id}')" title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
                ${wishIcon}
            </button>
            <div class="card-image-wrapper">
                <img src="${p.image || 'https://via.placeholder.com/300x300/8B4513/FFFFFF?text=No+Image'}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300/8B4513/FFFFFF?text=No+Image'">
                ${p.tags?.includes('luxury') ? '<div class="luxury-badge">LUXURY</div>' : ''}
            </div>
            <div class="card-info">
                <h4 class="product-name">${p.name}</h4>
                <div class="price">${formatCurrency(p.price)} AED</div>
                <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.id}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

function renderMainPage() {
    console.log("renderMainPage вызван, продуктов:", products.length);

    // New Arrivals
    const newContainer = document.getElementById('new-arrivals-slider');
    if (newContainer) {
        const newItems = products.filter(p => p.tags?.includes('new')).slice(0, 10);
        newContainer.innerHTML = newItems.length
            ? newItems.map(renderProductCard).join('')
            : '<div class="empty-message">Coming soon...</div>';
    }

    // Остальные категории
    const categories = [
        { id: 'birthday-slider', tag: 'birthday' },
        { id: 'bestseller-slider', tag: 'bestseller' },
        { id: 'luxury-slider', tag: 'luxury' }
        { id: 'vases-slider', tag: 'vases' }
        { id: 'speciality-slider', tag: 'speciality' }
    ];
    categories.forEach(({ id, tag }) => {
        const container = document.getElementById(id);
        if (!container) return;

        const filtered = products.filter(p => p.tags?.includes(tag));
        container.innerHTML = filtered.length
            ? filtered.map(renderProductCard).join('')
            : '<div class="empty-message">Coming soon...</div>';
    });

    // Shop All
    const allGrid = document.getElementById('all-products-grid');
    if (allGrid) {
        allGrid.innerHTML = products.length
            ? products.map(renderProductCard).join('')
            : '<div class="empty-message">No products yet...</div>';
    }

    updateBadges();
}

window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const existingItem = cart.find(i => i.id === id);
    if (existingItem) {
        existingItem.qty = (existingItem.qty || 1) + 1;
    } else {
        cart.push({ ...p, qty: 1 });
    }

    saveCart();
    updateBadges();

    if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
        tg.showAlert(`${p.name} added to cart!`);
    }

    document.getElementById('cart-container').innerHTML = renderCartItems();
};

window.toggleWishlist = (id) => {
    const idx = wishlist.findIndex(item => item.id === id);
    if (idx === -1) {
        const p = products.find(p => p.id === id);
        if (p) wishlist.push({ ...p });
    } else {
        wishlist.splice(idx, 1);
    }

    localStorage.setItem('taveine_wishlist', JSON.stringify(wishlist));
    updateBadges();
    renderMainPage();

    document.getElementById('wish-container').innerHTML = renderWishlistItems();

    if (tg) tg.HapticFeedback.notificationOccurred('success');
};

function saveCart() {
    localStorage.setItem('taveine_cart', JSON.stringify(cart));
    updateBadges();
}

function updateBadges() {
    const wCount = document.getElementById('w-count');
    const cCount = document.getElementById('c-count');

    if (wCount) wCount.textContent = wishlist.length;
    if (cCount) cCount.textContent = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

window.openProductDetail = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('product-detail-content').innerHTML = `
        <div class="product-gallery">
            <img src="${p.image || 'https://via.placeholder.com/400x400/8B4513/FFFFFF?text=No+Image'}" alt="${p.name}" class="main-product-image">
            ${p.tags?.includes('luxury') ? '<div class="luxury-badge-large">LUXURY COLLECTION</div>' : ''}
        </div>
        <div class="product-info-block">
            <div class="product-header">
                <h1 class="product-title">${p.name}</h1>
                ${p.tags?.includes('luxury') ? '<span class="luxury-tag">LUXURY</span>' : ''}
            </div>
            <div class="product-price-large">${formatCurrency(p.price)} AED</div>
            <div class="product-description">${p.description || 'Exquisite floral arrangement crafted with premium blooms for unforgettable moments.'}</div>
            <div class="product-actions">
                <button class="add-to-cart-large" onclick="addToCart('${p.id}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add to Cart
                </button>
                <button class="add-to-wishlist-large" onclick="event.stopPropagation(); toggleWishlist('${p.id}')">
                    ${wishlist.some(item => item.id === p.id) ?
                        '<svg viewBox="0 0 24 24" fill="currentColor" class="wish-filled"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' :
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="wish-empty"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
                    }
                </button>
            </div>
        </div>
    `;

    document.getElementById('product-detail').style.display = 'block';

    if (tg) {
        tg.HapticFeedback.notificationOccurred('impact');
        tg.expand();
    }
};

window.closeProductDetail = () => {
    document.getElementById('product-detail').style.display = 'none';
};

window.openPage = (id) => {
    document.getElementById(id).style.display = 'block';
    if (tg) tg.expand();
};

window.closePage = (id) => {
    document.getElementById(id).style.display = 'none';
};

window.toggleMenu = () => {
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');
};

window.openSearch = () => {
    document.getElementById('search-page').classList.add('active');
    document.getElementById('search-input').focus();
};

window.closeSearch = () => {
    document.getElementById('search-page').classList.remove('active');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results-products').innerHTML = '';
};

function renderSearchResults(results) {
    const container = document.getElementById('search-results-products');
    if (!container) return;

    container.innerHTML = results.length ?
        `<div class="search-results">${results.map(renderProductCard).join('')}</div>` :
        '<div class="empty-search">No products found</div>';
}

function renderWishlistItems() {
    if (!wishlist.length) {
        return '<div class="empty-wishlist">Your wishlist is empty. Start adding your favorite blooms!</div>';
    }

    return wishlist.map(p => `
        <div class="wishlist-item">
            <img src="${p.image || 'https://via.placeholder.com/80x80'}" alt="${p.name}" class="wishlist-image">
            <div class="wishlist-info">
                <h4>${p.name}</h4>
                <div class="wishlist-price">${formatCurrency(p.price)} AED</div>
            </div>
            <div class="wishlist-actions">
                <button class="add-to-cart-small" onclick="addToCart('${p.id}')">Add to Cart</button>
                <button class="remove-wishlist" onclick="removeFromWishlist('${p.id}')">Remove</button>
            </div>
        </div>
    `).join('');
}

function renderCartItems() {
    if (!cart.length) {
        return `
            <div class="empty-cart">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <h3>Your cart is empty</h3>
                <p>Discover beautiful flowers waiting for you</p>
                <button class="continue-shopping" onclick="closePage('cart-drawer')">Continue Shopping</button>
            </div>
        `;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);

    return `
        <div class="cart-items">
            ${cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image || 'https://via.placeholder.com/80x80'}" alt="${item.name}" class="cart-image">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-price">${formatCurrency(item.price)} AED</div>
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                            <span class="qty">${item.qty || 1}</span>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <div class="cart-total">${formatCurrency(item.price * (item.qty || 1))} AED</div>
                    <button class="remove-cart" onclick="removeFromCart('${item.id}')">×</button>
                </div>
            `).join('')}
        </div>
        <div class="cart-total-section">
            <div class="total-row">
                <span>Total:</span>
                <span class="total-amount">${formatCurrency(total)} AED</span>
            </div>
            <button class="checkout-btn" onclick="openPage('checkout-info-page')">Оформить заказ</button>
        </div>
    `;
}

window.updateQuantity = (id, change) => {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty = Math.max(1, (item.qty || 1) + change);
        if (item.qty === 0) {
            removeFromCart(id);
            return;
        }
        saveCart();
        document.getElementById('cart-container').innerHTML = renderCartItems();
        if (tg) tg.HapticFeedback.notificationOccurred('impact');
    }
};

window.removeFromCart = (id) => {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    document.getElementById('cart-container').innerHTML = renderCartItems();
    updateBadges();
    if (tg) tg.showAlert('Item removed from cart');
};

window.removeFromWishlist = (id) => {
    wishlist = wishlist.filter(i => i.id !== id);
    localStorage.setItem('taveine_wishlist', JSON.stringify(wishlist));
    updateBadges();
    document.getElementById('wish-container').innerHTML = renderWishlistItems();
    renderMainPage();
    if (tg) tg.showAlert('Removed from wishlist');
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-AE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

// Аккордеон для бокового меню
window.toggleSubmenu = function(element) {
    const submenu = element.nextElementSibling;
    const isActive = submenu.classList.contains('active');
    // Закрываем все другие подменю
    document.querySelectorAll('.submenu.active').forEach(sub => {
        if (sub !== submenu) {
            sub.classList.remove('active');
            sub.previousElementSibling.classList.remove('active');
        }
    });
    // Переключаем текущее
    submenu.classList.toggle('active', !isActive);
    element.classList.toggle('active', !isActive);
};

// Отключаем overscroll и pull-to-refresh в Telegram Web App
Telegram.WebApp.ready();
Telegram.WebApp.expand(); // растягивает апп на весь экран
Telegram.WebApp.disableVerticalSwipes(); // отключает вертикальный свайп для закрытия
Telegram.WebApp.setBackgroundColor("#001f24"); // твой тёмный фон, чтобы красиво

// Mapping категорий → тегов
const categoryMapping = {
    'Christmas Collection': 'christmas',
    'Spring': 'spring',
    'New Arrivals': 'new',
    'Best Sellers': 'bestseller',
    'Luxury': 'luxury',
    'Specialty': 'specialty',
    'Je t’aime Collection': 'jetaime',
    'Vases': 'vases',
    'Box': 'box',
    'Anniversary': 'anniversary',
    'Birthday': 'birthday',
    'I’m Sorry': 'imsorry',
    'New Baby': 'newbaby',
    'Event Design Services': 'eventdesign',
    'Forever Rose': 'forever',
    'Balloons': 'balloons'
};

// Открытие страницы категории
window.openCategory = (categoryName) => {
    let filteredProducts = [];
    if (categoryName === 'All') {
        filteredProducts = [...products];
    } else {
        const tag = categoryMapping[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '');
        filteredProducts = products.filter(p => p.tags?.includes(tag));
    }

    const container = document.getElementById('category-slider');
    container.innerHTML = filteredProducts.length
        ? filteredProducts.map(renderProductCard).join('')
        : '<div class="empty-message">No products in this category yet...</div>';

    document.getElementById('category-title').textContent = categoryName;
    document.getElementById('category-page').style.display = 'block';

    if (tg) {
        tg.expand();
        tg.HapticFeedback.notificationOccurred('impact');
    }
};

// Открытие страницы "О нас"
window.openAbout = () => {
    document.getElementById('about-page').style.display = 'block';
    if (tg) tg.expand();
};

// Обработчик чекаута
const checkoutForm = document.getElementById('simple-checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('customer-name')?.value.trim();
        const email = document.getElementById('customer-email')?.value.trim();
        const phone = document.getElementById('customer-phone')?.value.trim();
        const address = document.getElementById('customer-address')?.value.trim();
        const comment = document.getElementById('customer-comment')?.value.trim() || 'Без комментария';

        if (!name || !email || !phone || !address) {
            if (tg) tg.showAlert('Заполните все обязательные поля!');
            return;
        }

        const order = {
            id: 'ORDER-' + Date.now().toString().slice(-8),
            created: new Date().toLocaleString('ru-RU'),
            status: 'Новый',
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                qty: item.qty || 1,
                subtotal: item.price * (item.qty || 1)
            })),
            customer: { name, email, phone, address, comment },
            total: cart.reduce((sum, i) => sum + i.price * (i.qty || 1), 0)
        };

        let orders = JSON.parse(localStorage.getItem('taveine_orders') || '[]');
        orders.push(order);
        localStorage.setItem('taveine_orders', JSON.stringify(orders));

        try {
            await addDoc(collection(db, "orders"), {
                ...order,
                createdAt: new Date(),
                status: "Новый"
            });
            console.log("Заказ сохранён в Firebase:", order.id);
        } catch (err) {
            console.error("Ошибка сохранения в Firebase:", err);
        }

        cart = [];
        saveCart();
        updateBadges();
        document.getElementById('cart-container').innerHTML = renderCartItems();

        if (tg) {
            tg.showAlert(`Заказ ${order.id} оформлен!\nМы свяжемся с вами скоро.`);
        } else {
            alert(`Заказ ${order.id} оформлен!`);
        }

        closePage('checkout-info-page');
    });
}

// Запускаем инициализацию только один раз
document.addEventListener('DOMContentLoaded', () => {
    init();
});
