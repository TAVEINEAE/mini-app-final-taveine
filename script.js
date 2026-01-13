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
const tg = window.Telegram?.WebApp || null;

let products = [];
let cart = JSON.parse(localStorage.getItem('taveine_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('taveine_wishlist')) || [];

/* ===== MENU ===== */
window.toggleMenu = () => {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('menu-overlay').classList.toggle('active');
};

window.toggleSubMenu = el => {
    el.nextElementSibling.classList.toggle('open');
};

window.goHome = () => {
    renderMain(products);
    toggleMenu();
};

window.filterCategory = cat => {
    renderMain(products.filter(p => p.category === cat));
    toggleMenu();
};

window.filterTag = tag => {
    renderMain(products.filter(p => p.tags?.includes(tag)));
    toggleMenu();
};

/* ===== RENDER ===== */
function renderMain(list) {
    document.getElementById('all-products-grid').innerHTML =
        list.map(p => renderCard(p)).join('');
}

function renderCard(p) {
    const liked = wishlist.some(x => x.id === p.id);
    return `
    <div class="card">
        <button class="wish-icon-btn" onclick="toggleWish('${p.id}')">${liked ? '❤️' : '🤍'}</button>
        <img src="${p.image || 'https://via.placeholder.com/300'}">
        <div class="card-info">
            <h4>${p.name}</h4>
            <b>${Number(p.price).toFixed(2)} AED</b>
            <button class="add-btn" onclick="addToCart('${p.id}')">Add to Cart</button>
        </div>
    </div>`;
}

/* ===== CART & WISH ===== */
window.addToCart = id => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const i = cart.find(x => x.id === id);
    i ? i.qty++ : cart.push({ ...p, qty: 1 });
    localStorage.setItem('taveine_cart', JSON.stringify(cart));
};

window.toggleWish = id => {
    const i = wishlist.findIndex(x => x.id === id);
    i === -1 ? wishlist.push(products.find(p => p.id === id)) : wishlist.splice(i,1);
    localStorage.setItem('taveine_wishlist', JSON.stringify(wishlist));
    renderMain(products);
};

/* ===== FOOTER ===== */
window.toggleFooterAcc = el => el.parentElement.classList.toggle('active');

/* ===== START ===== */
document.addEventListener('DOMContentLoaded', async () => {
    tg?.expand();
    const snap = await getDocs(collection(db, "products"));
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMain(products);
});