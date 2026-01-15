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
        console.error("Firebase products load failed:", e);
    }
}

// ── Main render ─────────────────────────────────────────────────────────
function renderMainPage() {
    const sliders = [
        { id: 'new-arrivals-slider', tag: 'new' },
        { id: 'birthday-slider', tag: 'birthday' },
        { id: 'best-sellers-slider', tag: 'bestseller' },
        { id: 'luxury-slider', tag: 'luxury' }
    ];

    sliders.forEach(({ id, tag }) => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const items = products.filter(p => p.tags?.includes(tag));
        el.innerHTML = items.length 
            ? items.map(renderProductCard).join('')
            : '<div style="padding:40px;text-align:center;opacity:0.6;">Coming soon...</div>';
    });

    // All products grid
    const allGrid = document.getElementById('all-products-grid');
    if (allGrid) {
        allGrid.innerHTML = products.map(renderProductCard).join('');
    }
}

function renderProductCard(p) {
    const inWishlist = wishlist.some(item => item.id === p.id);
    
    return `
        <div class="card" onclick="openProductDetail('${p.id}')">
            <button class="wish-btn-overlay" 
                    onclick="event.stopPropagation(); toggleWishlist('${p.id}')"
                    aria-label="wishlist toggle">
                ${inWishlist ? '❤️' : '🤍'}
            </button>
            <img src="${p.image || 'https://via.placeholder.com/480x600?text=—'}" 
                 alt="${p.name}" loading="lazy">
            <div class="card-info">
                <h4>${p.name}</h4>
                <div class="price">${Number(p.price).toFixed(2)} AED</div>
                <button class="add-btn" 
                        onclick="event.stopPropagation(); addToCart('${p.id}')">
                    Add to cart
                </button>
            </div>
        </div>
    `;
}

// ── Product detail ──────────────────────────────────────────────────────
window.openProductDetail = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('product-detail-content').innerHTML = `
        <div class="product-gallery">
            <img src="${product.image || 'https://via.placeholder.com/720x960'}" alt="${product.name}">
        </div>
        <div class="product-info-block">
            <h1 class="product-title">${product.name}</h1>
            <div class="product-price">${Number(product.price).toFixed(2)} AED</div>
            ${product.description ? `<div class="description">${product.description}</div>` : ''}
            <div style="margin:32px 0 48px;">
                <button class="add-btn" style="padding:16px;font-size:1.1rem;" 
                        onclick="addToCart('${product.id}')">
                    Add to cart
                </button>
            </div>
        </div>
    `;

    const page = document.getElementById('product-detail');
    page.style.display = 'block';
    document.body.style.overflow = 'hidden';
    setTimeout(() => page.classList.add('fade-in'), 20);
};

window.closeProductDetail = () => {
    const page = document.getElementById('product-detail');
    page.classList.remove('fade-in');
    setTimeout(() => {
        page.style.display = 'none';
        document.body.style.overflow = '';
    }, 420);
};

// ── Cart logic ──────────────────────────────────────────────────────────
window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty = (item.qty || 1) + 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCart();
    tg?.HapticFeedback?.notificationOccurred('success');
};

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

function renderCart() {
    const container = document.getElementById('cart-container');
    const footer = document.getElementById('cart-footer-logic');
    
    if (!container) return;

    if (cart.length === 0) {
        footer.style.display = 'none';
        container.innerHTML = `
            <div style="padding:120px 24px;text-align:center;">
                <h2 style="margin-bottom:24px;">Your cart is empty</h2>
                <button class="add-btn" onclick="closePage('cart-drawer')">Continue shopping</button>
            </div>`;
        return;
    }

    footer.style.display = 'block';

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
                        <button onclick="updateQty(${i},-1)">−</button>
                        <span>${item.qty || 1}</span>
                        <button onclick="updateQty(${i},1)">+</button>
                    </div>
                    <button class="remove-link" onclick="removeFromCart(${i})">Remove</button>
                </div>
            </div>
        `;
    }).join('') + `
        <div style="padding:24px 0;color:#666;font-size:0.95rem;text-align:center;">
            Customers also bought
        </div>
        <div class="grid" style="padding:0 16px;">
            ${products.slice(0,4).map(renderProductCard).join('')}
        </div>
    `;

    document.getElementById('cart-total-sum')?.setAttribute('data-value', total.toFixed(2));
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
    renderWishlist();
};

function renderWishlist() {
    const container = document.getElementById('wish-container');
    if (!container) return;

    if (wishlist.length === 0) {
        container.innerHTML = `
            <div style="padding:120px 24px;text-align:center;">
                <h2>Wishlist is empty</h2>
                <button class="add-btn" onclick="closePage('wish-page')" style="margin-top:24px;">
                    Browse collection
                </button>
            </div>`;
    } else {
        container.innerHTML = `<div class="grid">${wishlist.map(renderProductCard).join('')}</div>`;
    }
}

// ── Helpers & UI controls ───────────────────────────────────────────────
function updateBadges() {
    document.getElementById('w-count').textContent = wishlist.length;
    document.getElementById('c-count').textContent = cart.length;
}

window.toggleMenu = () => {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('menu-overlay').classList.toggle('active');
};

window.toggleAccordion = (el) => {
    const parent = el.parentElement;
    const icon = el.querySelector('.accordion-icon');
    
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item !== parent) {
            item.classList.remove('open');
            item.querySelector('.accordion-icon')?.replaceChildren(document.createTextNode('+'));
        }
    });

    parent.classList.toggle('open');
    icon.textContent = parent.classList.contains('open') ? '−' : '+';
};

window.openPage = (id) => {
    document.getElementById(id).style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    if (id === 'cart-drawer') renderCart();
    if (id === 'wish-page') renderWishlist();
};

window.closePage = (id) => {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = '';
};

window.openSearch = () => {
    document.getElementById('search-page').classList.add('active');
};

window.closeSearch = () => {
    document.getElementById('search-page').classList.remove('active');
};

window.clearSearchField = () => {
    const input = document.getElementById('product-search-input');
    input.value = '';
    input.dispatchEvent(new Event('input'));
};

// Search live filter
document.getElementById('product-search-input')?.addEventListener('input', e => {
    const term = e.target.value.toLowerCase().trim();
    document.getElementById('clear-search').style.display = term ? 'block' : 'none';
    
    const results = products.filter(p => p.name.toLowerCase().includes(term));
    
    document.getElementById('search-results-products').innerHTML = results.length
        ? results.map(p => `
            <div class="search-result-item" onclick="closeSearch();openProductDetail('${p.id}')">
                <img src="${p.image||''}" alt="">
                <div>
                    <div style="font-weight:500;">${p.name}</div>
                    <div style="color:#666;font-size:0.9rem;">${p.price} AED</div>
                </div>
            </div>
        `).join('')
        : '<div style="padding:40px;text-align:center;opacity:0.6;">Nothing found</div>';
});

// Start
document.addEventListener('DOMContentLoaded', init);