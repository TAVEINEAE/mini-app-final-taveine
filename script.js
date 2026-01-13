const tg = window.Telegram?.WebApp;

// БАЗА ДАННЫХ (50 товаров)
const products = [];
const categories = ['Christmas', 'Spring', 'Luxury', 'Vases', 'Box', 'Anniversary', 'Birthday'];

// Генерируем 50 товаров для теста
for (let i = 1; i <= 55; i++) {
    products.push({
        id: i,
        name: `Product ${i} ${categories[i % categories.length]}`,
        price: 150 + (i * 10),
        cat: categories[i % categories.length],
        tag: i < 10 ? 'new' : (i < 20 ? 'sale' : 'popular'),
        img: `https://picsum.photos/seed/${i+50}/300/300` // Заглушка фото
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (tg) { tg.ready(); tg.expand(); }
    renderAll();
});

function renderAll() {
    // Рендерим табы (New Arrival по умолчанию)
    showTab('new', document.querySelector('.tab-btn'));
    
    // Shop All
    renderGrid(products, 'all-products-grid');
    
    // Luxury Section
    const luxury = products.filter(p => p.cat === 'Luxury');
    renderGrid(luxury, 'luxury-grid');
}

function renderGrid(list, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = list.map(p => `
        <div class="card">
            <img src="${p.img}">
            <h4>${p.name}</h4>
            <b>${p.price} AED</b>
            <button onclick="addToCart(${p.id})" style="background:var(--green); color:#fff; border:none; padding:5px 10px; border-radius:3px; font-size:11px; margin-bottom:10px">Add</button>
        </div>
    `).join('');
}

// Переключение табов
function showTab(tag, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = products.filter(p => p.tag === tag);
    renderGrid(filtered, 'tab-grid');
}

// Меню
function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

function toggleAcc(id) {
    const el = document.getElementById(id);
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

function filterBy(cat) {
    const filtered = products.filter(p => p.cat === cat);
    renderGrid(filtered, 'all-products-grid');
    document.querySelector('.shop-all .section-title').innerText = "Category: " + cat;
    toggleMenu();
    window.scrollTo({top: 500, behavior: 'smooth'});
}

// Системные функции
function openPage(id) { document.getElementById(id).style.display = 'block'; }
function closePage(id) { document.getElementById(id).style.display = 'none'; }

let cCount = 0;
function addToCart(id) {
    cCount++;
    document.getElementById('c-count').innerText = cCount;
    tg?.HapticFeedback.impactOccurred('medium');
}

function search(val) {
    const filtered = products.filter(p => p.name.toLowerCase().includes(val.toLowerCase()));
    renderGrid(filtered, 'search-grid');
}
