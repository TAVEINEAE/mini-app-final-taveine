const tg = window.Telegram?.WebApp;

// Тестовые данные (замени на свои реальные пути к фото)
const productsData = [
    { name: "Rose Box Classic", price: 620, image: "box1.jpg", category: "box", tags: ["recommended"] },
    { name: "Luxury Red Roses", price: 950, image: "lux1.jpg", category: "luxury", tags: ["popular"] },
    { name: "White Vase Bouquet", price: 480, image: "vase1.jpg", category: "vases", tags: ["new"] },
    { name: "Garden Vase Mix", price: 520, image: "vase2.jpg", category: "vases", tags: ["recommended"] }
];

let cart = [];

document.addEventListener("DOMContentLoaded", () => {
    if (tg) {
        tg.ready();
        tg.expand();
        tg.headerColor = "#1f3f38";
    }
    // Рендерим рекомендованные товары при загрузке
    switchTab('recommended', document.querySelector('.tab.active'));
});

function renderProducts(list, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = "";

    if (list.length === 0) {
        grid.innerHTML = "<p style='grid-column: 1/3; text-align:center; padding: 20px;'>Nothing found</p>";
        return;
    }

    list.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}" onclick="openProductDetail('${p.name}')">
            <h3>${p.name}</h3>
            <span>${p.price} AED</span>
            <button onclick="addToCart('${p.name}')">Add to Cart</button>
        `;
        grid.appendChild(card);
    });
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

function toggleSection(id) {
    const el = document.getElementById(id);
    const isHidden = el.style.display === "none" || el.style.display === "";
    el.style.display = isHidden ? "block" : "none";
}

function openSearch() {
    document.getElementById('search-page').style.display = 'block';
    renderProducts(productsData, 'search-grid');
}

function closePage(id) {
    document.getElementById(id).style.display = 'none';
}

function searchAll(query) {
    const q = query.toLowerCase();
    const filtered = productsData.filter(p => p.name.toLowerCase().includes(q));
    renderProducts(filtered, 'search-grid');
}

function switchTab(tag, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const filtered = productsData.filter(p => p.tags.includes(tag));
    renderProducts(filtered, 'products-grid');
}

function addToCart(name) {
    cart.push(name);
    document.getElementById('cart-count').innerText = cart.length;
    tg?.HapticFeedback?.impactOccurred('medium');
}

function openProductDetail(name) {
    const p = productsData.find(item => item.name === name);
    if (!p) return;
    
    const details = document.getElementById('product-details');
    details.innerHTML = `
        <img src="${p.image}" style="width:100%; border-radius:12px;">
        <h2 style="margin: 20px 0 10px;">${p.name}</h2>
        <p style="font-size: 20px; font-weight:bold; color: var(--green);">${p.price} AED</p>
        <p style="margin: 15px 0; color: #666;">Beautiful floral arrangement handcrafted by TAVÉINE experts.</p>
        <button onclick="addToCart('${p.name}')" style="width:100%; background: var(--green); color:#fff; border:none; padding:15px; border-radius:10px; font-weight:bold;">Add to Cart</button>
    `;
    document.getElementById('product-page').style.display = 'block';
}
