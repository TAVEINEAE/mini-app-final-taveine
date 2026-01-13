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
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

async function initApp() {
    tg?.expand();
    await loadProducts();
    renderMain();
    updateCounters();
    initSearch();
}

async function loadProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) { console.error("Firebase Error:", e); }
}

function renderMain() {
    renderGrid(products.filter(p => p.tags?.includes('new')), 'new-arrivals-slider');
    renderGrid(products, 'all-products-grid');
}

function renderGrid(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = data.map(p => `
        <div class="card">
            <button class="wish-btn" onclick="window.toggleWish('${p.id}')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:20px;">
                ${wishlist.some(item => item.id === p.id) ? '❤️' : '♡'}
            </button>
            <img src="${p.image}">
            <div style="padding:10px;">
                <h4 style="font-size:14px;">${p.name}</h4>
                <b style="color:#1f3f38;">${p.price} AED</b>
                <button class="add-btn" onclick="window.addToCart('${p.id}')">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

window.renderWishPage = () => {
    const container = document.getElementById('wish-container');
    if (wishlist.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size:60px; color:#eee; margin-bottom:20px;">♡</div>
                <h2>Wishlist is empty.</h2>
                <p>You don't have any products in the wishlist yet. You will find a lot of interesting products on our "Shop" page.</p>
                <button class="black-btn" onclick="window.closePage('wish-page')">Return to shop</button>
            </div>`;
    } else { renderGrid(wishlist, 'wish-container'); }
};

window.renderCartPage = () => {
    const container = document.getElementById('cart-container');
    const actions = document.getElementById('cart-actions');
    if (cart.length === 0) {
        actions.style.display = 'none';
        container.innerHTML = `<div class="empty-state"><h2>Your cart is empty</h2><p>Check out all available products in the shop</p><button class="black-btn" onclick="window.closePage('cart-drawer')">Return to shop ↗</button></div>`;
    } else {
        actions.style.display = 'block';
        container.innerHTML = cart.map((item, idx) => `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;"><span>${item.name}</span><button onclick="window.removeCart(${idx})" style="color:red; background:none; border:none;">✕</button></div>`).join('');
        document.getElementById('cart-total-sum').innerText = cart.reduce((s, i) => s + i.price, 0);
    }
};

function initSearch() {
    document.getElementById('product-search')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const results = products.filter(p => p.name.toLowerCase().includes(term));
        renderGrid(results, 'search-results-grid');
    });
}

window.toggleWish = (id) => {
    const p = products.find(x => x.id === id);
    const idx = wishlist.findIndex(x => x.id === id);
    if (idx === -1) wishlist.push(p); else wishlist.splice(idx, 1);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateCounters(); renderMain(); if(document.getElementById('wish-page').style.display === 'block') window.renderWishPage();
};

window.addToCart = (id) => {
    cart.push(products.find(x => x.id === id));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCounters(); tg?.HapticFeedback.notificationOccurred('success');
};

window.removeCart = (idx) => { cart.splice(idx, 1); localStorage.setItem('cart', JSON.stringify(cart)); window.renderCartPage(); updateCounters(); };

window.openPage = (id) => { 
    document.getElementById(id).style.display = 'block'; 
    if(id === 'wish-page') window.renderWishPage();
    if(id === 'cart-drawer') window.renderCartPage();
};
window.closePage = (id) => document.getElementById(id).style.display = 'none';
window.toggleMenu = () => document.getElementById('side-menu').classList.toggle('open');
window.toggleMenuAcc = (id) => { const el = document.getElementById(id); el.style.display = el.style.display === 'block' ? 'none' : 'block'; };

function updateCounters() {
    document.getElementById('w-count').innerText = wishlist.length;
    document.getElementById('c-count').innerText = cart.length;
}

document.addEventListener('DOMContentLoaded', initApp);
