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

async function startApp() {
    tg?.expand();
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMain();
        updateCounters();
        initSearchLogic();
    } catch (e) { console.error("Firebase Error:", e); }
}

function renderMain() {
    const grid = document.getElementById('all-products-grid');
    const slider = document.getElementById('new-arrivals-slider');
    if(grid) grid.innerHTML = products.map(p => renderCard(p)).join('');
    if(slider) {
        const newItems = products.filter(p => p.tags?.includes('new') || p.isNew);
        slider.innerHTML = newItems.map(p => renderCard(p)).join('');
    }
}

function renderCard(p) {
    const isWished = wishlist.some(x => x.id === p.id);
    return `
        <div class="card">
            <button onclick="toggleWish('${p.id}')" class="wish-icon-btn">
                ${isWished ? '❤️' : '🤍'}
            </button>
            <img src="${p.image || 'https://via.placeholder.com/300'}">
            <div class="card-info">
                <h4>${p.name || 'Product'}</h4>
                <b>${Number(p.price || 0).toFixed(2)} AED</b>
                <button class="add-btn" onclick="addToCart('${p.id}')">Add to Cart</button>
            </div>
        </div>`;
}

// Меню СЛЕВА
window.toggleMenu = () => {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('menu-overlay').classList.toggle('active');
};

window.toggleMenuAcc = (el) => {
    el.parentElement.classList.toggle('active');
};

// Поиск СПРАВА
window.openSearch = () => document.getElementById('search-drawer').classList.add('active');
window.closeSearch = () => document.getElementById('search-drawer').classList.remove('active');

// Футер Аккордеон
window.toggleFooterAcc = (el) => {
    el.parentElement.classList.toggle('active');
};

// КОРЗИНА
window.renderCartPage = () => {
    const container = document.getElementById('cart-container');
    const footer = document.getElementById('cart-footer-logic');
    if (cart.length === 0) {
        footer.style.display = 'none';
        container.innerHTML = `<div class="empty-state"><h2>Your cart is empty</h2><button class="white-btn" style="margin-top:20px" onclick="closePage('cart-drawer')">Return to shop</button></div>`;
    } else {
        footer.style.display = 'block';
        let total = 0;
        container.innerHTML = cart.map((item, index) => {
            total += item.price * (item.qty || 1);
            return `
                <div class="cart-item">
                    <img src="${item.image || 'https://via.placeholder.com/90'}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.price.toFixed(2)} AED</p>
                        <div class="qty-row">
                            <div class="qty-control">
                                <button onclick="updateQty(${index}, -1)">-</button>
                                <span>${item.qty || 1}</span>
                                <button onclick="updateQty(${index}, 1)">+</button>
                            </div>
                            <button class="remove-link" onclick="removeFromCart(${index})">Remove</button>
                        </div>
                    </div>
                </div>`;
        }).join('');
        document.getElementById('cart-total-sum').innerText = total.toFixed(2);
    }
};

window.updateQty = (index, delta) => {
    cart[index].qty = Math.max(1, (cart[index].qty || 1) + delta);
    saveCart(); window.renderCartPage();
};

window.removeFromCart = (index) => { cart.splice(index, 1); saveCart(); window.renderCartPage(); };

// ОБЩЕЕ
window.openPage = (id) => { 
    document.getElementById(id).style.display = 'flex'; 
    if(id==='cart-drawer') window.renderCartPage(); 
    if(id==='wish-page') window.renderWishPage(); 
};
window.closePage = (id) => document.getElementById(id).style.display = 'none';

window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const item = cart.find(x => x.id === id);
    if (item) item.qty++;
    else cart.push({ ...p, qty: 1 });
    saveCart();
    tg?.HapticFeedback.impactOccurred('light');
};

window.toggleWish = (id) => {
    const p = products.find(x => x.id === id);
    const idx = wishlist.findIndex(x => x.id === id);
    if (idx === -1) wishlist.push(p);
    else wishlist.splice(idx, 1);
    saveWishlist(); renderMain();
    if(document.getElementById('wish-page').style.display === 'flex') window.renderWishPage();
};

window.renderWishPage = () => {
    const container = document.getElementById('wish-container');
    container.innerHTML = wishlist.length === 0 
        ? `<div class="empty-state"><h2>Wishlist is empty</h2><button class="white-btn" style="margin-top:20px" onclick="closePage('wish-page')">Return to shop</button></div>`
        : `<div class="grid">${wishlist.map(p => renderCard(p)).join('')}</div>`;
};

function saveCart() { localStorage.setItem('taveine_cart', JSON.stringify(cart)); updateCounters(); }
function saveWishlist() { localStorage.setItem('taveine_wishlist', JSON.stringify(wishlist)); updateCounters(); }

function updateCounters() {
    document.getElementById('w-count').innerText = wishlist.length;
    document.getElementById('c-count').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
}

function initSearchLogic() {
    document.getElementById('product-search-input')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const results = products.filter(p => p.name.toLowerCase().includes(term));
        document.getElementById('search-results-grid').innerHTML = results.map(p => `
            <div class="search-item-line">
                <img src="${p.image || 'https://via.placeholder.com/70'}">
                <div><h4>${p.name}</h4><span>${p.price} AED</span></div>
            </div>`).join('');
    });
}

window.switchSearchTab = (tab) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-'+tab).classList.add('active');
};

document.addEventListener('DOMContentLoaded', startApp);
