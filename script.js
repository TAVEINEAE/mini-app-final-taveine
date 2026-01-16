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

async function init() {
    if (tg) { tg.expand(); tg.ready(); }
    try {
        const snapshot = await getDocs(collection(db, "products"));
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMainPage();
        updateBadges();
    } catch (e) { console.error("Load error:", e); }
}

function renderProductCard(p) {
    const inWishlist = wishlist.some(item => item.id === p.id);
    const wishIcon = inWishlist 
        ? `<svg viewBox="0 0 24 24" fill="#d43f3f" stroke="#d43f3f" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

    return `
        <div class="uniform-card" onclick="openProductDetail('${p.id}')">
            <button class="wish-btn-overlay" onclick="event.stopPropagation(); toggleWishlist('${p.id}')">
                ${wishIcon}
            </button>
            <div class="card-image-wrapper">
                <img src="${p.image || ''}" alt="${p.name}" loading="lazy">
            </div>
            <div class="card-info">
                <h4>${p.name}</h4>
                <div class="price">${Number(p.price || 0).toFixed(0)} AED</div>
                <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.id}')">
                    Add to cart
                </button>
            </div>
        </div>
    `;
}

function renderMainPage() {
    const sliders = ['new', 'birthday', 'bestseller', 'luxury'];
    sliders.forEach(tag => {
        const container = document.getElementById(`${tag === 'new' ? 'new-arrivals' : tag}-slider`);
        if (!container) return;
        const filtered = products.filter(p => p.tags?.includes(tag));
        container.innerHTML = filtered.length ? filtered.map(renderProductCard).join('') : '<div class="empty-message">Coming soon...</div>';
    });
    const allGrid = document.getElementById('all-products-grid');
    if (allGrid) allGrid.innerHTML = products.map(renderProductCard).join('');
}

window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const item = cart.find(i => i.id === id);
    if (item) item.qty = (item.qty || 1) + 1;
    else cart.push({ ...p, qty: 1 });
    saveCart();
    tg?.HapticFeedback?.notificationOccurred('success');
};

window.toggleWishlist = (id) => {
    const idx = wishlist.findIndex(item => item.id === id);
    if (idx === -1) {
        const p = products.find(p => p.id === id);
        if (p) wishlist.push(p);
    } else wishlist.splice(idx, 1);
    localStorage.setItem('taveine_wishlist', JSON.stringify(wishlist));
    updateBadges();
    renderMainPage();
};

function saveCart() {
    localStorage.setItem('taveine_cart', JSON.stringify(cart));
    updateBadges();
}

function updateBadges() {
    document.getElementById('w-count').textContent = wishlist.length;
    document.getElementById('c-count').textContent = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

window.openProductDetail = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('product-detail-content').innerHTML = `
        <div class="product-gallery"><img src="${p.image || ''}" style="width:100%"></div>
        <div class="product-info-block" style="padding:20px;">
            <h1 class="product-title" style="color:white;">${p.name}</h1>
            <div class="product-price" style="color:var(--gold); font-size:1.5rem; margin:10px 0;">${Number(p.price).toFixed(2)} AED</div>
            <div class="description" style="color:rgba(255,255,255,0.8);">${p.description || ''}</div>
            <button class="add-btn" style="width:100%; padding:15px; margin-top:20px;" onclick="addToCart('${p.id}')">Add to cart</button>
        </div>
    `;
    document.getElementById('product-detail').style.display = 'block';
};

window.closeProductDetail = () => { document.getElementById('product-detail').style.display = 'none'; };
window.openPage = (id) => { document.getElementById(id).style.display = 'block'; };
window.closePage = (id) => { document.getElementById(id).style.display = 'none'; };
window.toggleMenu = () => { 
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('menu-overlay').classList.toggle('active');
};
window.openSearch = () => { document.getElementById('search-page').classList.add('active'); };
window.closeSearch = () => { document.getElementById('search-page').classList.remove('active'); };

document.addEventListener('DOMContentLoaded', init);
