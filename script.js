const tg = window.Telegram?.WebApp;

// БАЗА ТОВАРОВ (Добавьте сюда больше товаров)
const productsData = [
    { name: "Christmas Red Box", price: 450, image: "img1.jpg", category: "Christmas Collection" },
    { name: "Spring Mixed Bouquet", price: 320, image: "img2.jpg", category: "Spring" },
    { name: "Luxury Gold Roses", price: 1200, image: "img3.jpg", category: "Luxury" },
    { name: "Classic White Vases", price: 280, image: "img4.jpg", category: "Vases" },
    { name: "Birthday Balloon Set", price: 150, image: "img5.jpg", category: "Balloons" },
    { name: "New Arrival Peonies", price: 550, image: "img6.jpg", category: "New Arrivals" },
    { name: "Forever Rose in Glass", price: 400, image: "img7.jpg", category: "Forever Rose" },
    { name: "Anniversary Special", price: 800, image: "img8.jpg", category: "Anniversary" }
];

document.addEventListener("DOMContentLoaded", () => {
    if (tg) { tg.ready(); tg.expand(); }
    renderProducts(productsData, 'products-grid');
});

function renderProducts(list, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = list.map(p => `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" onclick="openProductDetail('${p.name}')">
            <h3>${p.name}</h3>
            <span>${p.price} AED</span>
            <button onclick="addToCart('${p.name}')">Add to Cart</button>
        </div>
    `).join('');
}

// Управление меню
function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

function toggleSection(id) {
    const el = document.getElementById(id);
    const allSubs = document.querySelectorAll('.menu-subbody');
    
    // Закрываем другие, если открываем новый (опционально)
    // allSubs.forEach(s => { if(s.id !== id) s.style.display = 'none'; });

    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
}

// Фильтрация при нажатии на категорию в меню
function filterByCategory(catName) {
    const filtered = productsData.filter(p => p.category === catName);
    renderProducts(filtered, 'products-grid');
    toggleMenu(); // Закрыть меню после выбора
    window.scrollTo(0, 0);
}

function openSearch() {
    document.getElementById('search-page').style.display = 'block';
    renderProducts(productsData, 'search-grid');
}

function closePage(id) {
    document.getElementById(id).style.display = 'none';
}

function searchAll(query) {
    const filtered = productsData.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    renderProducts(filtered, 'search-grid');
}

function addToCart(name) {
    tg?.HapticFeedback?.impactOccurred('light');
    alert(name + " added to cart!");
}

function openProductDetail(name) {
    const p = productsData.find(i => i.name === name);
    const details = document.getElementById('product-details');
    details.innerHTML = `
        <img src="${p.image}" style="width:100%">
        <h2 style="padding:15px 0">${p.name}</h2>
        <p style="font-size:20px; font-weight:bold">${p.price} AED</p>
        <button onclick="addToCart('${p.name}')" style="width:100%; background:var(--green); color:#fff; padding:15px; border:none; border-radius:8px; margin-top:20px">Buy Now</button>
    `;
    document.getElementById('product-page').style.display = 'block';
}
