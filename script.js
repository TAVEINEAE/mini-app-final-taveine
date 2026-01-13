const tg = window.Telegram?.WebApp;

// База данных
const products = [];
const categories = ['Christmas', 'Spring', 'Luxury', 'Vases', 'Box'];
const tags = ['new', 'sale', 'popular'];

for (let i = 1; i <= 60; i++) {
    products.push({
        id: i,
        name: `Flower ${i}`,
        price: 150 + (i * 5),
        cat: categories[i % categories.length],
        tag: tags[i % tags.length],
        img: `https://picsum.photos/seed/${i+100}/300/300`
    });
}

let cart = [];
let wishlist = [];

document.addEventListener("DOMContentLoaded", () => {
    if (tg) { tg.ready(); tg.expand(); }
    renderSliders();
    renderGrid(products, 'all-products-grid');
});

function renderSliders() {
    renderGrid(products.filter(p => p.tag === 'new').slice(0, 4), 'new-slider');
    renderGrid(products.filter(p => p.tag === 'sale').slice(0, 4), 'sale-slider');
    renderGrid(products.filter(p => p.tag === 'popular').slice(0, 4), 'popular-slider');
}

function renderGrid(list, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = list.map(p => `
        <div class="card">
            <button class="wish-btn" onclick="addToWishlist(${p.id})">❤</button>
            <img src="${p.img}">
            <h4>${p.name}</h4>
            <b>${p.price} AED</b>
            <button class="add-btn" onclick="addToCart(${p.id})" style="background:var(--green); color:#fff; border:none; padding:8px; width:90%; border-radius:3px;">Add to Cart</button>
        </div>
    `).join('');
}

// Категории (новая страница)
function openCategoryPage(cat) {
    document.getElementById('cat-title').innerText = cat;
    const filtered = products.filter(p => p.cat === cat);
    renderGrid(filtered, 'category-grid');
    openPage('category-page');
    toggleMenu();
}

function showInfoPage(id) {
    openPage(id + '-page');
    toggleMenu();
}

// Корзина (Drawer)
function toggleCart() {
    document.getElementById('cart-drawer').classList.toggle('open');
    renderCart();
}

function addToCart(id) {
    const p = products.find(x => x.id === id);
    cart.push(p);
    updateCounters();
    tg?.HapticFeedback.impactOccurred('medium');
}

function renderCart() {
    const list = document.getElementById('cart-items-list');
    list.innerHTML = cart.map((item, idx) => `
        <div class="wish-item">
            <img src="${item.img}">
            <div>
                <p>${item.name}</p>
                <b>${item.price} AED</b>
            </div>
            <button onclick="cart.splice(${idx},1); renderCart(); updateCounters();" style="margin-left:auto; background:none; border:none;">✕</button>
        </div>
    `).join('');
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cart-total-price').innerText = total;
}

// Wishlist
function addToWishlist(id) {
    if (!wishlist.find(x => x.id === id)) {
        wishlist.push(products.find(x => x.id === id));
        updateCounters();
        alert('Added to wishlist!');
    }
}

function renderWishlist() {
    const container = document.getElementById('wish-list-container');
    container.innerHTML = wishlist.map((p, idx) => `
        <div class="wish-item">
            <img src="${p.img}">
            <div><p>${p.name}</p><b>${p.price} AED</b></div>
            <button onclick="wishlist.splice(${idx},1); renderWishlist(); updateCounters();" style="margin-left:auto; background:none; border:none;">✕</button>
        </div>
    `).join('');
}

function updateCounters() {
    document.getElementById('w-count').innerText = wishlist.length;
    document.getElementById('c-count').innerText = cart.length;
}

// Системные
function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }
function toggleAcc(id) { const el = document.getElementById(id); el.style.display = el.style.display === 'block' ? 'none' : 'block'; }
function openPage(id) { 
    document.getElementById(id).style.display = 'block'; 
    if(id === 'wish-page') renderWishlist();
}
function closePage(id) { document.getElementById(id).style.display = 'none'; }
