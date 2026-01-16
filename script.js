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

let products = [];
let cart = JSON.parse(localStorage.getItem('taveine_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('taveine_wishlist')) || [];

async function init() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMainPage();
        updateBadges();
    } catch (e) {
        console.error(e);
    }
}

function renderProductCard(p) {
    const inWishlist = wishlist.some(item => item.id === p.id);
    return `
        <div class="card" onclick="openProductDetail('${p.id}')">
            <button class="wish-btn-modern ${inWishlist ? 'active' : ''}"
                    onclick="event.stopPropagation(); toggleWishlist('${p.id}')"
                    aria-label="Add to wishlist">
                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
            <img src="${p.image || 'https://via.placeholder.com/480x600'}" alt="${p.name}" loading="lazy">
            <div class="card-info">
                <h4>${p.name}</h4>
                <div class="price">${Number(p.price).toFixed(2)} AED</div>
                <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.id}')">
                    Add to cart
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
            el.innerHTML = items.length ? items.map(renderProductCard).join('') : '<div class="empty-message">Coming soon...</div>';
        }
    });

    const allGrid = document.getElementById('all-products-grid');
    if (allGrid) {
        allGrid.innerHTML = products.map(renderProductCard).join('');
    }
}

window.toggleWishlist = (id) => {
    const idx = wishlist.findIndex(item => item.id === id);
    if (idx === -1) {
        const p = products.find(p => p.id === id);
        if (p) wishlist.push(p);
    } else {
        wishlist.splice(idx, 1);
    }
    localStorage.setItem('taveine_wishlist', JSON.stringify(wishlist));
    updateBadges();
    renderMainPage();           // Refresh all hearts
    if (document.getElementById('wish-page').style.display !== 'none') {
        document.getElementById('wish-container').innerHTML = wishlist.length 
            ? `<div class="grid">${wishlist.map(renderProductCard).join('')}</div>`
            : '<div class="empty-message">Your wishlist is empty</div>';
    }
};

function updateBadges() {
    document.getElementById('w-count').textContent = wishlist.length;
    document.getElementById('c-count').textContent = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
}

// Rest of your original functions (openProductDetail, addToCart, renderCart, etc.) remain unchanged
// You can paste them here from your previous working version

document.addEventListener('DOMContentLoaded', init);
