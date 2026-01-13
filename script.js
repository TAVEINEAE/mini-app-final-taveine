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
    const querySnapshot = await getDocs(collection(db, "products"));
    products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    renderMain();
    updateCounters();
    initSearch();
}

function renderMain() {
    const grid = document.getElementById('all-products-grid');
    const slider = document.getElementById('new-arrivals-slider');
    
    if(grid) grid.innerHTML = products.map(p => renderCard(p)).join('');
    if(slider) slider.innerHTML = products.filter(p => p.tags?.includes('new')).map(p => renderCard(p)).join('');
}

function renderCard(p) {
    const isWished = wishlist.some(x => x.id === p.id);
    return `
        <div class="card">
            <button onclick="window.toggleWish('${p.id}')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:20px; z-index:5;">
                ${isWished ? '❤️' : '🤍'}
            </button>
            <img src="${p.image}">
            <div class="card-info">
                <h4>${p.name}</h4>
                <b>${p.price}.00 AED</b>
                <button class="add-btn" onclick="window.addToCart('${p.id}')">Add to Cart</button>
            </div>
        </div>`;
}

// ЛОГИКА КОРЗИНЫ (Как на скриншоте)
window.renderCartPage = () => {
    const container = document.getElementById('cart-container');
    const footer = document.getElementById('cart-footer-logic');
    
    if (cart.length === 0) {
        footer.style.display = 'none';
        container.innerHTML = `
            <div class="empty-state">
                <h2>Your cart is empty</h2>
                <p>You may check out all the available products and buy some in the shop</p>
                <button class="black-btn" onclick="window.closePage('cart-drawer')">Return to shop ↗</button>
            </div>`;
    } else {
        footer.style.display = 'block';
        let total = 0;
        container.innerHTML = cart.map((item, index) => {
            total += item.price * (item.qty || 1);
            return `
                <div class="cart-item">
                    <img src="${item.image}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.price}.00 AED</p>
                        <div style="display:flex; align-items:center;">
                            <div class="qty-control">
                                <button onclick="window.updateQty(${index}, -1)">-</button>
                                <span>${item.qty || 1}</span>
                                <button onclick="window.updateQty(${index}, 1)">+</button>
                            </div>
                            <button class="remove-link" onclick="window.removeFromCart(${index})">Remove</button>
                        </div>
                    </div>
                </div>`;
        }).join('') + `
            <div class="section-title" style="margin-top:20px;">Customers also bought</div>
            <div class="grid">${products.slice(0,2).map(p => renderCard(p)).join('')}</div>
        `;
        document.getElementById('cart-total-sum').innerText = total.toFixed(2);
    }
};

window.updateQty = (index, delta) => {
    cart[index].qty = (cart[index].qty || 1) + delta;
    if (cart[index].qty < 1) cart[index].qty = 1;
    saveCart();
    window.renderCartPage();
};

// ЛОГИКА ВИШЛИСТА (Как на скриншоте)
window.renderWishPage = () => {
    const container = document.getElementById('wish-container');
    if (wishlist.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size:50px; color:#ccc;">♡</div>
                <h2>Wishlist is empty.</h2>
                <p>You don't have any products in the wishlist yet. You will find a lot of interesting products on our "Shop" page.</p>
                <button class="black-btn" onclick="window.closePage('wish-page')">Return to shop</button>
            </div>`;
    } else {
        container.innerHTML = `<div class="grid">${wishlist.map(p => renderCard(p)).join('')}</div>`;
    }
};

window.toggleWish = (id) => {
    const idx = wishlist.findIndex(x => x.id === id);
    if (idx === -1) wishlist.push(products.find(p => p.id === id));
    else wishlist.splice(idx, 1);
    localStorage.setItem('taveine_wishlist', JSON.stringify(wishlist));
    updateCounters(); renderMain();
    if(document.getElementById('wish-page').style.display === 'block') window.renderWishPage();
};

window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    const existing = cart.find(x => x.id === id);
    if (existing) existing.qty = (existing.qty || 1) + 1;
    else cart.push({...p, qty: 1});
    saveCart();
    tg?.HapticFeedback.notificationOccurred('success');
};

window.removeFromCart = (index) => { cart.splice(index, 1); saveCart(); window.renderCartPage(); };
function saveCart() { localStorage.setItem('taveine_cart', JSON.stringify(cart)); updateCounters(); }

function updateCounters() {
    document.getElementById('w-count').innerText = wishlist.length;
    document.getElementById('c-count').innerText = cart.length;
}

window.openPage = (id) => {
    document.getElementById(id).style.display = 'block';
    if(id === 'cart-drawer') window.renderCartPage();
    if(id === 'wish-page') window.renderWishPage();
};
window.closePage = (id) => document.getElementById(id).style.display = 'none';

function initSearch() {
    document.getElementById('product-search')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const res = products.filter(p => p.name.toLowerCase().includes(term));
        document.getElementById('search-results-grid').innerHTML = res.map(p => renderCard(p)).join('');
    });
}

window.openSearch = () => {
    document.getElementById('search-page').classList.add('active');
};

window.closeSearch = () => {
    document.getElementById('search-page').classList.remove('active');
};

document.addEventListener('DOMContentLoaded', startApp);
