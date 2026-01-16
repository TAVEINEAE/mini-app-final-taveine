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
        console.error("Firebase error:", e);
    }
}

function renderProductCard(p) {
    const inWishlist = wishlist.some(item => item.id === p.id);
    return `
        <div class="card" onclick="openProductDetail('${p.id}')">
            <button class="wish-btn-overlay ${inWishlist ? 'active' : ''}"
                    onclick="event.stopPropagation(); toggleWishlist('${p.id}')"
                    aria-label="Toggle wishlist">
                ${inWishlist ? '❤️' : '🤍'}
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
    if (allGrid) allGrid.innerHTML = products.map(renderProductCard).join('');
}

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
            <button class="add-btn" onclick="addToCart('${p.id}')">Add to cart</button>
        </div>
    `;
    document.getElementById('product-detail').style.display = 'block';
};

window.closeProductDetail = () => {
    document.getElementById('product-detail').style.display = 'none';
};

window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const item = cart.find(i => i.id === id);
    if (item) item.qty = (item.qty || 1) + 1;
    else cart.push({ ...p, qty: 1 });
    localStorage.setItem('taveine_cart', JSON.stringify(cart));
    updateBadges();
};

function renderCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-message">Your cart is empty</div>';
        document.getElementById('cart-footer').style.display = 'none';
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
                    <div>${Number(item.price).toFixed(2)} AED</div>
                    <div class="qty-row">
                        <button onclick="updateQty(${i}, -1)">−</button>
                        <span>${item.qty || 1}</span>
                        <button onclick="updateQty(${i}, 1)">+</button>
                    </div>
                    <button onclick="removeFromCart(${i})">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('cart-footer').innerHTML = `
        <div class="cart-total">Total: ${total.toFixed(2)} AED</div>
        <button class="add-btn">Checkout</button>
    `;
    document.getElementById('cart-footer').style.display = 'block';
}

window.updateQty = (i, delta) => {
    cart[i].qty = Math.max(1, (cart[i].qty || 1) + delta);
    localStorage.setItem('taveine_cart', JSON.stringify(cart));
    renderCart();
    updateBadges();
};

window.removeFromCart = (i) => {
    cart.splice(i, 1);
    localStorage.setItem('taveine_cart', JSON.stringify(cart));
    renderCart();
    updateBadges();
};

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
    if (document.getElementById('wish-page').style.display === 'block') renderWishlist();
};

function renderWishlist() {
    const container = document.getElementById('wish-container');
    container.innerHTML = wishlist.length 
        ? `<div class="grid">${wishlist.map(renderProductCard).join('')}</div>`
        : '<div class="empty-message">Wishlist is empty</div>';
}

function updateBadges() {
    document.getElementById('w-count').textContent = wishlist.length;
    document.getElementById('c-count').textContent = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
}

window.toggleMenu = () => {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('menu-overlay').classList.toggle('active');
};

window.openCategoryPage = (group, tag) => {
    document.getElementById('category-title').textContent = `${group} • ${tag}`;
    const filtered = products.filter(p => p.tags?.includes(tag));
    document.getElementById('category-content').innerHTML = filtered.length 
        ? `<div class="grid">${filtered.map(renderProductCard).join('')}</div>`
        : '<div class="empty-message">No products yet</div>';
    document.getElementById('category-page').style.display = 'block';
    toggleMenu();
};

window.openPage = (id) => {
    document.getElementById(id).style.display = 'block';
    if (id === 'wish-page') renderWishlist();
    if (id === 'cart-drawer') renderCart();
};

window.closePage = (id) => {
    document.getElementById(id).style.display = 'none';
};

window.openSearch = () => {
    document.getElementById('search-page').classList.add('active');
};

window.closeSearch = () => {
    document.getElementById('search-page').classList.remove('active');
};

window.clearSearchField = () => {
    document.getElementById('product-search-input').value = '';
    document.getElementById('product-search-input').dispatchEvent(new Event('input'));
};

document.getElementById('product-search-input')?.addEventListener('input', e => {
    const term = e.target.value.toLowerCase().trim();
    document.getElementById('clear-search').style.display = term ? 'block' : 'none';
    const results = products.filter(p => p.name.toLowerCase().includes(term));
    document.getElementById('search-results-products').innerHTML = results.map(p => `
        <div class="search-result-item" onclick="closeSearch(); openProductDetail('${p.id}')">
            <img src="${p.image||''}" alt="">
            <div>${p.name} – ${p.price} AED</div>
        </div>
    `).join('') || '<div class="empty-message">Nothing found</div>';
});

document.addEventListener('DOMContentLoaded', init);
