import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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

// ── Инициализация приложения ────────────────────────────────────────────────
async function startApp() {
    if (tg) {
        tg.expand();
        tg.ready();
    }

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        renderMain();
        updateCounters();
    } catch (err) {
        console.error("Ошибка загрузки продуктов из Firebase:", err);
        showErrorNotification("Не удалось загрузить товары");
    }
}

// ── Основной рендер главной страницы ────────────────────────────────────────
function renderMain() {
    const sliderConfigs = [
        { id: 'new-arrivals-slider', tag: 'new' },
        { id: 'birthday-slider', tag: 'birthday' },
        { id: 'best-sellers-slider', tag: 'bestseller' },
        { id: 'luxury-slider', tag: 'luxury' }
    ];

    sliderConfigs.forEach(config => {
        const container = document.getElementById(config.id);
        if (!container) return;

        const filtered = products.filter(p => p.tags?.includes(config.tag));
        
        container.innerHTML = filtered.length > 0
            ? filtered.map(p => renderCard(p)).join('')
            : '<div class="empty-slider-message">Скоро появятся новинки...</div>';
    });

    // Все товары внизу
    const grid = document.getElementById('all-products-grid');
    if (grid) {
        grid.innerHTML = products.map(p => renderCard(p)).join('');
    }
}

// ── Шаблон карточки товара ──────────────────────────────────────────────────
function renderCard(product) {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    
    return `
        <div class="card" onclick="openProduct('${product.id}')" role="button" tabindex="0">
            <button class="wish-btn-overlay" 
                    onclick="event.stopPropagation(); toggleWish('${product.id}')"
                    aria-label="${isInWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}">
                ${isInWishlist ? '❤️' : '🤍'}
            </button>
            
            <img src="${product.image || 'https://via.placeholder.com/480x600?text=No+Image'}" 
                 alt="${product.name}"
                 loading="lazy">
                 
            <div class="card-info">
                <h4>${product.name}</h4>
                <div class="price">${product.price.toFixed(2)} AED</div>
                <button class="add-btn" 
                        onclick="event.stopPropagation(); addToCart('${product.id}')">
                    В корзину
                </button>
            </div>
        </div>
    `;
}

// ── Открытие отдельной страницы товара ──────────────────────────────────────
window.openProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const container = document.getElementById('product-content');
    if (!container) return;

    const isInWishlist = wishlist.some(item => item.id === product.id);

    container.innerHTML = `
        <div class="product-gallery">
            <img src="${product.image || 'https://via.placeholder.com/720x960'}" 
                 alt="${product.name}">
        </div>
        
        <div class="product-info">
            <h1 class="product-title">${product.name}</h1>
            <div class="product-price">${product.price.toFixed(2)} AED</div>
            
            ${product.description ? `
                <div class="product-description">
                    ${product.description}
                </div>
            ` : ''}

            <div class="product-actions">
                <button class="add-to-cart-btn large"
                        onclick="addToCart('${product.id}')">
                    Добавить в корзину
                </button>
                
                <button class="wishlist-btn"
                        onclick="toggleWish('${product.id}'); this.textContent = '${isInWishlist ? 'В избранное' : 'Уже в избранном'}'">
                    ${isInWishlist ? 'Уже в избранном' : 'В избранное'}
                </button>
            </div>
        </div>
    `;

    const page = document.getElementById('product-page');
    page.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Плавная анимация появления
    setTimeout(() => page.classList.add('visible'), 10);
};

window.closeProductPage = () => {
    const page = document.getElementById('product-page');
    page.classList.remove('visible');
    setTimeout(() => {
        page.style.display = 'none';
        document.body.style.overflow = '';
    }, 400);
};

// ── Работа с корзиной ───────────────────────────────────────────────────────
window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCart();
    tg?.HapticFeedback?.notificationOccurred('success');
    showNotification(`Добавлен: ${product.name}`);
};

window.updateQty = (index, delta) => {
    const newQty = Math.max(1, (cart[index].qty || 1) + delta);
    cart[index].qty = newQty;
    saveCart();
    renderCartPage();
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    saveCart();
    renderCartPage();
};

function saveCart() {
    localStorage.setItem('taveine_cart', JSON.stringify(cart));
    updateCounters();
}

// ── Страница корзины ────────────────────────────────────────────────────────
window.renderCartPage = () => {
    const container = document.getElementById('cart-container');
    const footer = document.getElementById('cart-footer-logic');
    
    if (cart.length === 0) {
        footer.style.display = 'none';
        container.innerHTML = `
            <div class="empty-state">
                <h2>Ваша корзина пуста</h2>
                <button class="black-btn" onclick="closePage('cart-drawer')">
                    Вернуться в магазин
                </button>
            </div>`;
        return;
    }

    footer.style.display = 'block';
    
    let total = 0;
    const itemsHtml = cart.map((item, i) => {
        total += item.price * (item.qty || 1);
        return `
            <div class="cart-item">
                <img src="${item.image || 'https://via.placeholder.com/120'}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price.toFixed(2)} AED</p>
                    <div class="qty-control">
                        <button onclick="updateQty(${i}, -1)">−</button>
                        <span>${item.qty || 1}</span>
                        <button onclick="updateQty(${i}, 1)">+</button>
                    </div>
                    <button class="remove-link" onclick="removeFromCart(${i})">
                        Удалить
                    </button>
                </div>
            </div>`;
    }).join('');

    container.innerHTML = itemsHtml + `
        <div class="section-title">Вам также может понравиться</div>
        <div class="grid mini-grid">
            ${products.slice(0, 4).map(p => renderCard(p)).join('')}
        </div>
    `;

    document.getElementById('cart-total-sum').textContent = total.toFixed(2);
};

// ── Избранное ───────────────────────────────────────────────────────────────
window.toggleWish = (id) => {
    const index = wishlist.findIndex(item => item.id === id);
    
    if (index === -1) {
        const product = products.find(p => p.id === id);
        if (product) {
            wishlist.push(product);
            tg?.HapticFeedback?.notificationOccurred('success');
        }
    } else {
        wishlist.splice(index, 1);
    }

    localStorage.setItem('taveine_wishlist', JSON.stringify(wishlist));
    updateCounters();
    renderMain();           // обновляем все карточки на главной
    renderWishPage();       // если открыта страница избранного
};

window.renderWishPage = () => {
    const container = document.getElementById('wish-container');
    
    if (wishlist.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>Список избранного пуст</h2>
                <button class="black-btn" onclick="closePage('wish-page')">
                    Вернуться в магазин
                </button>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="grid">
                ${wishlist.map(p => renderCard(p)).join('')}
            </div>`;
    }
};

// ── Вспомогательные функции ─────────────────────────────────────────────────
function updateCounters() {
    document.getElementById('w-count').textContent = wishlist.length;
    document.getElementById('c-count').textContent = cart.length;
}

function showNotification(message) {
    // Можно сделать красивый toast в будущем
    console.log("[NOTIFICATION]", message);
    // или tg?.showPopup(...)
}

function showErrorNotification(message) {
    console.error("[ERROR]", message);
    // tg?.showAlert(message) или кастомный toast
}

// ── Существующие функции интерфейса (оставлены без существенных изменений) ─
window.toggleMenu = () => {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('menu-overlay').classList.toggle('active');
};

window.toggleAccordion = (element) => {
    const parent = element.parentElement;
    const icon = element.querySelector('.icon');
    
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item !== parent) {
            item.classList.remove('open');
            item.querySelector('.icon')?.replaceChildren(document.createTextNode('+'));
        }
    });

    parent.classList.toggle('open');
    icon.textContent = parent.classList.contains('open') ? '−' : '+';
};

window.openPage = (id) => {
    const page = document.getElementById(id);
    if (page) {
        page.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        if (id === 'cart-drawer') renderCartPage();
        if (id === 'wish-page') renderWishPage();
    }
};

window.closePage = (id) => {
    const page = document.getElementById(id);
    if (page) {
        page.style.display = 'none';
        document.body.style.overflow = '';
    }
};

window.openSearch = () => {
    document.getElementById('search-page').classList.add('active');
};

window.closeSearch = () => {
    document.getElementById('search-page').classList.remove('active');
};

window.clearSearchField = () => {
    const input = document.getElementById('product-search-input');
    if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
    }
};

// ── Запуск ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', startApp);