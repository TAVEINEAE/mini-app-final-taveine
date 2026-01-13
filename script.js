const tg = window.Telegram?.WebApp;

// БАЗА ДАННЫХ ТОВАРОВ
const productsData = [
    { name: "Christmas Red Rose Box", price: 450, image: "https://via.placeholder.com/300", category: "Christmas Collection" },
    { name: "Spring Tulip Vase", price: 280, image: "https://via.placeholder.com/300", category: "Spring" },
    { name: "Luxury Gold Orchid", price: 1200, image: "https://via.placeholder.com/300", category: "Luxury" },
    { name: "Standard Box Mix", price: 350, image: "https://via.placeholder.com/300", category: "Box" },
    { name: "Anniversary White Roses", price: 500, image: "https://via.placeholder.com/300", category: "Anniversary" },
    { name: "Birthday Balloon Set", price: 150, image: "https://via.placeholder.com/300", category: "Balloons" },
    { name: "New Baby Blue Bouquet", price: 300, image: "https://via.placeholder.com/300", category: "New Baby" },
];

let cart = [];

// Запуск при загрузке
document.addEventListener("DOMContentLoaded", () => {
    if (tg) {
        tg.ready();
        tg.expand();
    }
    renderProducts(productsData, 'products-grid');
});

// ФУНКЦИЯ ОТРИСОВКИ ТОВАРОВ
function renderProducts(list, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = list.map(p => `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" onclick="openProductDetail('${p.name}')">
            <h3>${p.name}</h3>
            <span>${p.price} AED</span>
            <button onclick="addToCart('${p.name}')">Add to Cart</button>
        </div>
    `).join('');
}

// УПРАВЛЕНИЕ МЕНЮ
function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

function toggleSection(id) {
    const el = document.getElementById(id);
    const isVisible = el.style.display === 'block';
    
    // Закрываем все остальные секции в меню
    document.querySelectorAll('.menu-subbody').forEach(s => s.style.display = 'none');
    
    // Переключаем текущую
    el.style.display = isVisible ? 'none' : 'block';
}

// ФИЛЬТРАЦИЯ ПО КАТЕГОРИИ
function filterByCategory(cat) {
    const filtered = productsData.filter(p => p.category === cat);
    renderProducts(filtered, 'products-grid');
    toggleMenu(); // Закрываем меню после выбора
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// ТАБЫ НА ГЛАВНОМ ЭКРАНЕ
function switchTab(type, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    
    if (type === 'all') {
        renderProducts(productsData, 'products-grid');
    } else {
        const filtered = productsData.filter(p => p.category === type);
        renderProducts(filtered, 'products-grid');
    }
}

// ПОИСК
function openSearch() {
    document.getElementById('search-page').style.display = 'block';
}

function searchAll(query) {
    const q = query.toLowerCase();
    const filtered = productsData.filter(p => p.name.toLowerCase().includes(q));
    renderProducts(filtered, 'search-grid');
}

// ДЕТАЛИ ТОВАРОВ
function openProductDetail(name) {
    const p = productsData.find(i => i.name === name);
    const details = document.getElementById('product-details');
    details.innerHTML = `
        <img src="${p.image}" style="width:100%; border-radius:15px">
        <h2 style="margin:20px 0">${p.name}</h2>
        <p style="font-size:24px; color:var(--green); font-weight:bold">${p.price} AED</p>
        <p style="margin:20px 0; color:#666">Premium quality flowers from TAVÉINE AE. Handcrafted for your special moments.</p>
        <button onclick="addToCart('${p.name}')" style="width:100%; background:var(--green); color:#fff; border:none; padding:18px; border-radius:12px; font-size:18px">Add to Cart</button>
    `;
    document.getElementById('product-page').style.display = 'block';
}

function closePage(id) {
    document.getElementById(id).style.display = 'none';
}

// КОРЗИНА (Haptic)
function addToCart(name) {
    cart.push(name);
    document.getElementById('cart-count').innerText = cart.length;
    tg?.HapticFeedback?.impactOccurred('medium');
}
