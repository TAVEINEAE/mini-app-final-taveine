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

// Инициализация
async function initApp() {
    tg?.expand();
    await loadProducts();
    renderMain();
    updateCounters();
    initSearchLogic();
}

async function loadProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) { console.error("Firebase Error:", e); }
}

function renderMain() {
    const slider = document.getElementById('new-arrivals-slider');
    const grid = document.getElementById('all-products-grid');
    
    const newItems = products.filter(p => p.tags && p.tags.includes('new'));
    
    if(slider) renderGrid(newItems, 'new-arrivals-slider');
    if(grid) renderGrid(products, 'all-products-grid');
}

function renderGrid(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = `<p style="padding:20px; color:#888;">No products found...</p>`;
        return;
    }

    container.innerHTML = data.map(p => `
        <div class="card">
            <button class="wish-btn" onclick="window.toggleWish('${p.id}')">
                ${wishlist.some(item => item.id === p.id) ? '❤️' : '♡'}
            </button>
            <img src="${p.image}" alt="${p.name}">
            <div class="card-body">
                <h4>${p.name}</h4>
                <b>${p.price} AED</b>
                <button class="add-btn" onclick="window.addToCart('${p.id}')">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// Поиск
function initSearchLogic() {
    const searchInput = document.getElementById('product-search');
    searchInput?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const resultsGrid = document.getElementById('search-results-grid');
        const emptyState = document.getElementById('search-empty-state');

        if (term.length > 0) {
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(term) || 
                (p.category && p.category.toLowerCase().includes(term))
            );
            
            if (filtered.length > 0) {
                emptyState.innerHTML = '';
                renderGrid(filtered, 'search-results-grid');
            } else {
                resultsGrid.innerHTML = '';
                emptyState.innerHTML = `
                    <div class="empty-state">
                        <h2>No results found</h2>
                        <p>We couldn't find anything matching "${term}"</p>
                    </div>`;
            }
        } else {
            resultsGrid.innerHTML = '';
            emptyState.innerHTML = `<div class="empty-state"><p>Type something to search...</p></div>`;
        }
    });
}

// Wishlist Logic
window.toggleWish = (id) => {
    const index = wishlist.findIndex(i => i.id === id);
    if (index === -1) {
        wishlist.push(products.find(p => p.id === id));
        tg?.HapticFeedback.impactOccurred('light');
    } else {
        wishlist.splice(index, 1);
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateCounters();
    renderMain();
    if(document.getElementById('wish-page').style.display === 'block') window.renderWishPage();
};

window.renderWishPage = () => {
    const container = document.getElementById('wish-container');
    if (wishlist.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size:60px; color:#eee;">♡</div>
                <h2>Wishlist is empty.</h2>
                <p>You don't have any products in the wishlist yet.</p>
                <button class="black-btn" onclick="window.closePage('wish-page')">Return to shop</button>
            </div>`;
    } else {
        renderGrid(wishlist, 'wish-container');
    }
};

// Cart Logic
window.addToCart = (id) => {
    const item = products.find(p => p.id === id);
    cart.push(item);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCounters();
    tg?.HapticFeedback.notificationOccurred('success');
};

window.renderCartPage = () => {
    const container = document.getElementById('cart-container');
    const actions = document.getElementById('cart-actions');
    
    if (cart.length === 0) {
        actions.style.display = 'none';
        container.innerHTML = `
            <div class="empty-state">
                <h2>Your cart is empty</h2>
                <p>Check out our products and start shopping.</p>
                <button class="black-btn" onclick="window.closePage('cart-drawer')">Return to shop ↗</button>
            </div>`;
    } else {
        actions.style.display = 'block';
        container.innerHTML = `
            <div style="padding:15px;">
                ${cart.map((item, index) => `
                    <div class="wish-item" style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;">
                        <div>
                            <b>${item.name}</b><br>
                            <small>${item.price} AED</small>
                        </div>
                        <button onclick="window.removeFromCart(${index})" style="background:none; border:none; color:red;">Remove</button>
                    </div>
                `).join('')}
            </div>`;
        const total = cart.reduce((acc, item) => acc + (item.price || 0), 0);
        document.getElementById('cart-total-sum').innerText = total;
    }
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCounters();
    window.renderCartPage();
};

// UI Helpers
window.openPage = (id) => {
    document.getElementById(id).style.display = 'block';
    if(id === 'wish-page') window.renderWishPage();
    if(id === 'cart-drawer') window.renderCartPage();
};
window.closePage = (id) => document.getElementById(id).style.display = 'none';
window.toggleMenu = () => document.getElementById('side-menu').classList.toggle('open');
window.toggleMenuAcc = (id) => {
    const el = document.getElementById(id);
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
};

function updateCounters() {
    document.getElementById('w-count').innerText = wishlist.length;
    document.getElementById('c-count').innerText = cart.length;
}

document.addEventListener('DOMContentLoaded', initApp);
