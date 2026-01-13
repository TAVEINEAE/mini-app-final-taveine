const tg = window.Telegram?.WebApp;
let wishlist = [];
let cart = [];
let currentProduct = null;

const productsData = [
    { name: "Rose Box Classic", price: 620, image: "box1.jpg", category: "box", tags: ["recommended", "popular"] },
    { name: "Luxury Red Roses", price: 950, image: "lux1.jpg", category: "luxury", tags: ["popular"] },
    { name: "White Vase Bouquet", price: 480, image: "vase1.jpg", category: "vases", tags: ["new"] },
    { name: "Garden Vase Mix", price: 520, image: "vase2.jpg", category: "vases", tags: ["recommended"] }
];

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
    if (tg) {
        tg.ready();
        tg.expand();
        tg.BackButton.onClick(handleBack);
    }
    renderProducts(productsData.filter(p => p.tags.includes('recommended')), 'products-grid');
});

function renderProducts(list, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = list.map(p => `
        <div class="card">
            <img src="${p.image}" onclick="openProductByName('${p.name}')">
            <h3>${p.name}</h3>
            <span>${p.price} AED</span>
            <button onclick="addToCart('${p.name}')">Add to cart</button>
        </div>
    `).join('');
}

// Навигация
function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

function openSearch() {
    showPage('search-page');
    renderProducts(productsData, 'search-grid');
}

function openCategory(cat, title) {
    toggleMenu();
    document.getElementById('category-title').innerText = title;
    showPage('category-page');
    renderProducts(productsData.filter(p => p.category.includes(cat)), 'category-grid');
}

function openProductByName(name) {
    const p = productsData.find(x => x.name === name);
    if (!p) return;
    currentProduct = p;
    document.getElementById('product-img').src = p.image;
    document.getElementById('product-title').innerText = p.name;
    document.getElementById('product-price').innerText = p.price + " AED";
    document.getElementById('product-desc').innerText = "Premium quality floral arrangement.";
    showPage('product-page');
}

// Вспомогательные функции страниц
function showPage(id) {
    document.getElementById(id).style.display = 'block';
    tg?.BackButton.show();
}

function handleBack() {
    const pages = ['search-page', 'category-page', 'product-page'];
    pages.forEach(id => document.getElementById(id).style.display = 'none');
    tg?.BackButton.hide();
}

function closeSearch() { handleBack(); }
function closeCategory() { handleBack(); }
function closeProduct() { handleBack(); }

// Логика поиска
function searchAll(query) {
    const filtered = productsData.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    renderProducts(filtered, 'search-grid');
}

function addToCart(name) {
    cart.push(name);
    document.getElementById('cart-count').innerText = cart.length;
    tg?.HapticFeedback.impactOccurred('medium');
}

function switchTab(tag, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const filtered = productsData.filter(p => p.tags.includes(tag));
    renderProducts(filtered, 'products-grid');
}
