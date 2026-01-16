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
        console.error("Firebase load error:", e);
    }
}

// ── Rendering ───────────────────────────────────────────────────────────
function renderProductCard(p) {
    const inWishlist = wishlist.some(item => item.id === p.id);
    return `
        <div class="card uniform-card" onclick="openProductDetail('${p.id}')">
            <button class="wish-btn-overlay" onclick="event.stopPropagation(); toggleWishlist('${p.id}')"
                    aria-label="Toggle wishlist">
                ${inWishlist ? '❤️' : '🤍'}
            </button>
            <div class="card-image-wrapper">
                <img src="${p.image || 'https://via.placeholder.com/480x640?text=No+Image'}" 
                     alt="${p.name}" loading="lazy">
            </div>
            <div class="card-info">
                <h4>${p.name}</h4>
                <div class="price">${Number(p.price || 0).toFixed(2)} AED</div>
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
        const container = document.getElementById(id);
        if (!container) return;
        const items = products.filter(p => p.tags?.includes(tag));
        container.innerHTML = items.length 
            ? items.map(renderProductCard).join('')
            : '<div class="empty-message">Coming soon...</div>';
    });

    const allGrid = document.getElementById('all-products-grid');
    if (allGrid) {
        allGrid.innerHTML = products.map(renderProductCard).join('');
    }
}

// ── Category Page ───────────────────────────────────────────────────────
window.openCategoryPage = (group, tag) => {
    const title = document.getElementById('category-title');
    title.textContent = `${group} • ${tag.charAt(0).toUpperCase() + tag.slice(1)}`;

    const filtered = products.filter(p => p.tags?.includes(tag));
    document.getElementById('category-content').innerHTML = filtered.length
        ? `<div class="grid">${filtered.map(renderProductCard).join('')}</div>`
        : '<div class="empty-message">No products found in this category</div>';

    document.getElementById('category-page').style.display = 'block';
    document.body.style.overflow = 'hidden';
    toggleMenu();
};

// ── Product Detail ──────────────────────────────────────────────────────
window.openProductDetail = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;

    document.getElementById('product-detail-content').innerHTML = `
        <div class="product-gallery">
            <img src="${p.image || 'https://via.placeholder.com/720x960'}" alt="${p.name}">
        </div>
        <div class="product-info-block">
            <h1 class="product-title">${p.name}</h1>
            <div class="product-price">${Number(p.price).toFixed(2)} AED</div>
            ${p.description ? `<div class="description">${p.description}</div>` : ''}
            <button class="add-btn large" onclick="addToCart('${p.id}')">Add to cart</button>
        </div>
    `;

    document.getElementById('product-detail').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.closeProductDetail = () => {
    document.getElementById('product-detail').style.display = 'none';
    document.body.style.overflow = '';
};

// ── Cart ────────────────────────────────────────────────────────────────
window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const item = cart.find(i => i.id === id);
    if (item) item.qty = (item.qty || 1) + 1;
    else cart.push({ ...p, qty: 1 });
    saveCart();
    tg?.HapticFeedback?.notificationOccurred('success');
};

function renderCart() {
    const container = document.getElementById('cart-container');
    const footer = document.getElementById('cart-footer');
    if (!container || !footer) return;

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-state">Your cart is empty</div>`;
        footer.style.display = 'none';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, i) => {
        total += item.price * (item.qty || 1);
        return `
            <div class="cart-item">
                <img src="${item.image || ''}" alt="">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="price">${Number(item.price).toFixed(2)} AED</div>
                    <div class="qty-controls">
                        <button onclick="updateQty(${i}, -1)">−</button>
                        <span>${item.qty || 1}</span>
                        <button onclick="updateQty(${i}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${i})">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    footer.innerHTML = `
        <div class="cart-total">
            <span>Total:</span>
            <strong>${total.toFixed(2)} AED</strong>
        </div>
        <button class="add-btn large">Checkout</button>
    `;
    footer.style.display = 'block';
}

window.updateQty = (index, delta) => {
    cart[index].qty = Math.max(1, (cart[index].qty || 1) + delta);
    saveCart();
    renderCart();
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    saveCart();
    renderCart();
};

function saveCart() {
    localStorage.setItem('taveine_cart', JSON.stringify(cart));
    updateBadges();
}

// ── Wishlist ────────────────────────────────────────────────────────────
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
    renderMainPage();
};

function renderWishlist() {
    const container = document.getElementById('wish-container');
    if (!container) return;
    container.innerHTML = wishlist.length
        ? `<div class="grid">${wishlist.map(renderProductCard).join('')}</div>`
        : `<div class="empty-state">Your wishlist is empty</div>`;
}

// ── UI Controls ─────────────────────────────────────────────────────────
function updateBadges() {
    document.getElementById('w-count').textContent = wishlist.length;
    document.getElementById('c-count').textContent = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

window.toggleMenu = () => {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('menu-overlay').classList.toggle('active');
};

window.openPage = (id) => {
    document.getElementById(id).style.display = 'block';
    document.body.style.overflow = 'hidden';
    if (id === 'wish-page') renderWishlist();
    if (id === 'cart-drawer') renderCart();
};

window.closePage = (id) => {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = '';
};

window.openSearch = () => {
    document.getElementById('search-page').classList.add('active');
    document.getElementById('product-search-input').focus();
};

window.closeSearch = () => {
    document.getElementById('search-page').classList.remove('active');
};

window.clearSearchField = () => {
    const input = document.getElementById('product-search-input');
    input.value = '';
    input.dispatchEvent(new Event('input'));
};

// Live search
document.getElementById('product-search-input')?.addEventListener('input', e => {
    const term = e.target.value.toLowerCase().trim();
    document.getElementById('clear-search').style.display = term ? 'block' : 'none';

    const results = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
    );

    document.getElementById('search-results-products').innerHTML = results.length
        ? results.map(p => `
            <div class="search-result-item" onclick="closeSearch(); openProductDetail('${p.id}')">
                <img src="${p.image || ''}" alt="">
                <div>
                    <div class="name">${p.name}</div>
                    <div class="price">${Number(p.price).toFixed(2)} AED</div>
                </div>
            </div>
        `).join('')
        : '<div class="empty-message">Nothing found</div>';
});

// Start
document.addEventListener('DOMContentLoaded', init);
