// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// ── Init ────────────────────────────────────────────────────────────────
async function init() {
    if (tg) {
        tg.expand();
        tg.ready();
    }
    try {
        const snapshot = await getDocs(collection(db, "products"));
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMainPage();
        updateBadges();
    } catch (e) {
        console.error("Firebase error:", e);
    }
}

// ── Product Card (smaller, modern, better heart) ────────────────────────
function renderProductCard(p) {
    const inWishlist = wishlist.some(item => item.id === p.id);
    return `
        <div class="card" onclick="openProductDetail('${p.id}')">
            <button class="wish-btn ${inWishlist ? 'active' : ''}" 
                    onclick="event.stopPropagation(); toggleWishlist('${p.id}')"
                    aria-label="Toggle wishlist">
                <svg viewBox="0 0 24 24" class="heart-icon">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
            <div class="card-image">
                <img src="${p.image || 'https://via.placeholder.com/400x520?text=TAVÉINE'}" 
                     alt="${p.name}" loading="lazy">
            </div>
            <div class="card-info">
                <h4>${p.name}</h4>
                <div class="price">${Number(p.price || 0).toFixed(2)} AED</div>
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${p.id}')">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

function renderMainPage() {
    const sliders = [
        { id: 'new-arrivals-slider', tag: 'new' },
        { id: 'birthday-slider', tag: 'birthday' },
        { id: 'best-sellers-slider', tag: 'bestseller' },
        { id: 'luxury-slider', tag: 'luxury' }
    ];

    sliders.forEach(({ id, tag }) => {
        const el = document.getElementById(id);
        if (el) {
            const items = products.filter(p => p.tags?.includes(tag));
            el.innerHTML = items.length ? items.map(renderProductCard).join('') 
                                       : '<div class="empty">Coming soon...</div>';
        }
    });

    const all = document.getElementById('all-products-grid');
    if (all) all.innerHTML = products.map(renderProductCard).join('');
}

// ── Wishlist Logic (fixed & reliable) ───────────────────────────────────
window.toggleWishlist = (id) => {
    const index = wishlist.findIndex(item => item.id === id);
    if (index === -1) {
        const product = products.find(p => p.id === id);
        if (product) wishlist.push(product);
    } else {
        wishlist.splice(index, 1);
    }
    
    localStorage.setItem('taveine_wishlist', JSON.stringify(wishlist));
    updateBadges();
    renderMainPage();           // refresh hearts everywhere
    if (document.getElementById('wish-page').style.display === 'block') {
        renderWishlist();
    }
};

function renderWishlist() {
    const container = document.getElementById('wish-container');
    if (!container) return;
    container.innerHTML = wishlist.length 
        ? `<div class="grid">${wishlist.map(renderProductCard).join('')}</div>`
        : `<div class="empty-state">Your wishlist is empty</div>`;
}

// ── Other functions remain similar (cart, product detail, search, category page, etc.)
// ... (you can keep the rest from previous version - just make sure to call renderMainPage() after any wishlist/cart change)

// Start
document.addEventListener('DOMContentLoaded', init);
