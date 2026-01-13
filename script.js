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
let cart = [];
let wishlist = [];

// ЗАГРУЗКА ДАННЫХ
async function loadData() {
    try {
        const snap = await getDocs(collection(db, "products"));
        products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAll();
        initSearch();
    } catch (e) { console.error(e); }
}

function renderAll() {
    renderGrid(products.filter(p => p.tags?.includes('new')), 'new-slider');
    renderGrid(products, 'all-products-grid');
}

function renderGrid(list, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = list.map(p => `
        <div class="card">
            <button class="wish-btn" onclick="window.addToWishlist('${p.id}')">❤</button>
            <img src="${p.image}">
            <h4>${p.name}</h4>
            <b>${p.price} AED</b>
            <button class="add-btn" onclick="window.addToCart('${p.id}')">Add to Cart</button>
        </div>
    `).join('');
}

// ПУСТЫЕ СОСТОЯНИЯ
window.renderWishlist = () => {
    const cont = document.getElementById('wish-list-container');
    if (wishlist.length === 0) {
        cont.innerHTML = `<div class="empty-state"><h2>Wishlist is empty.</h2><p>Find interesting products on our Shop page.</p><button class="black-btn" onclick="window.closePage('wish-page')">Return to shop</button></div>`;
    } else {
        renderGrid(wishlist, 'wish-list-container');
    }
};

window.renderCart = () => {
    const cont = document.getElementById('cart-items-list');
    const footer = document.getElementById('cart-footer-actions');
    if (cart.length === 0) {
        cont.innerHTML = `<div class="empty-state"><h2>Your cart is empty</h2><p>Check out available products in the shop</p><button class="black-btn" onclick="window.closePage('cart-drawer')">Return to shop ↗</button></div>`;
        footer.style.display = 'none';
    } else {
        cont.innerHTML = cart.map(p => `<div class="wish-item"><b>${p.name}</b> - ${p.price} AED</div>`).join('');
        document.getElementById('cart-total-price').innerText = cart.reduce((s, p) => s + p.price, 0);
        footer.style.display = 'block';
    }
};

// ПОИСК
function initSearch() {
    document.getElementById('product-search')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const resGrid = document.getElementById('search-results-grid');
        const filtered = products.filter(p => p.name.toLowerCase().includes(term));
        renderGrid(filtered, 'search-results-grid');
    });
}

// ГЛОБАЛЬНЫЕ ФУНКЦИИ
window.toggleMenu = () => document.getElementById('side-menu').classList.toggle('open');
window.openPage = (id) => { 
    document.getElementById(id).style.display = 'block'; 
    if(id==='wish-page') window.renderWishlist();
};
window.closePage = (id) => document.getElementById(id).style.display = 'none';
window.toggleCart = () => { window.openPage('cart-drawer'); window.renderCart(); };

window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    if (p) { cart.push(p); updateCounters(); tg?.HapticFeedback.impactOccurred('medium'); }
};

window.addToWishlist = (id) => {
    if (!wishlist.find(x => x.id === id)) {
        wishlist.push(products.find(x => x.id === id));
        updateCounters();
    }
};

function updateCounters() {
    document.getElementById('w-count').innerText = wishlist.length;
    document.getElementById('c-count').innerText = cart.length;
}

window.toggleMenuAcc = (id) => {
    const el = document.getElementById(id);
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
};

document.addEventListener("DOMContentLoaded", () => {
    tg?.ready();
    loadData();
});
