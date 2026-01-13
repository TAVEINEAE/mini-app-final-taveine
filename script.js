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

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tg = window.Telegram?.WebApp;
let products = [];
let cart = [];
let wishlist = [];

// ================= ФУНКЦИИ АККОРДЕОНОВ (МЕНЮ И ФУТЕР) =================

window.toggleMenuAcc = (id) => {
    const target = document.getElementById(id);
    const parent = target.parentElement;
    const isOpen = parent.classList.contains('active');

    document.querySelectorAll('#side-menu .accordion-item').forEach(item => {
        item.classList.remove('active');
        const body = item.querySelector('.acc-body');
        if (body) body.style.display = 'none';
        const span = item.querySelector('.acc-header span');
        if (span) span.innerText = '+';
    });

    if (!isOpen) {
        parent.classList.add('active');
        if (target) target.style.display = 'block';
        const span = parent.querySelector('.acc-header span');
        if (span) span.innerText = '-';
    }
};

window.toggleFooterAcc = (id) => {
    const targetContent = document.getElementById(id);
    const parentItem = targetContent.parentElement;
    const isNowActive = parentItem.classList.contains('active');

    document.querySelectorAll('.footer-accordion .acc-item').forEach(item => {
        item.classList.remove('active');
        const content = item.querySelector('.acc-content');
        if (content) content.style.display = 'none';
        const span = item.querySelector('.acc-btn span');
        if (span) span.innerText = '+';
    });

    if (!isNowActive) {
        parentItem.classList.add('active');
        if (targetContent) targetContent.style.display = 'block';
        const span = parentItem.querySelector('.acc-btn span');
        if (span) span.innerText = '-';
    }
};

// ================= ЛОГИКА ТОВАРОВ И КАТЕГОРИЙ =================

window.openCategoryPage = (catName) => {
    const titleEl = document.getElementById('cat-title');
    const gridEl = document.getElementById('category-grid');
    
    if (titleEl) titleEl.innerText = catName;
    
    const filteredProducts = products.filter(p => p.category === catName);
    
    if (gridEl) {
        if (filteredProducts.length > 0) {
            gridEl.innerHTML = filteredProducts.map(p => `
                <div class="card">
                    <button class="wish-btn" onclick="window.addToWishlist('${p.id}')">❤</button>
                    <img src="${p.image || 'https://via.placeholder.com/300'}">
                    <h4>${p.name}</h4>
                    <b>${p.price} AED</b>
                    <button class="add-btn" onclick="window.addToCart('${p.id}')">Add to Cart</button>
                </div>
            `).join('');
        } else {
            gridEl.innerHTML = "<p style='padding:20px; color:gray;'>No products in this category yet.</p>";
        }
    }
    
    window.openPage('category-page'); 
    window.toggleMenu(); 
};

async function loadDataFromFirebase() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        renderAll();
        initSearch();
    } catch (e) {
        console.error("Firebase error:", e);
    }
}

function renderAll() {
    renderGrid(products.filter(p => p.tags?.includes('new')).slice(0, 4), 'new-slider');
    renderGrid(products.filter(p => p.tags?.includes('sale')).slice(0, 4), 'sale-slider');
    renderGrid(products.filter(p => p.tags?.includes('popular')).slice(0, 4), 'popular-slider');
    renderGrid(products, 'all-products-grid');
}

function renderGrid(list, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = list.map(p => `
        <div class="card">
            <button class="wish-btn" onclick="window.addToWishlist('${p.id}')">❤</button>
            <img src="${p.image || 'https://via.placeholder.com/300'}">
            <h4>${p.name}</h4>
            <b>${p.price} AED</b>
            <button class="add-btn" onclick="window.addToCart('${p.id}')">Add to Cart</button>
        </div>
    `).join('');
}

function initSearch() {
    document.getElementById('product-search')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const defContent = document.getElementById('default-content');
        const gridTitle = document.getElementById('grid-title');

        if (term.length > 0) {
            defContent.style.display = 'none';
            gridTitle.innerText = "Search Results";
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(term) || 
                p.category?.toLowerCase().includes(term) ||
                p.tags?.some(t => t.toLowerCase().includes(term))
            );
            renderGrid(filtered, 'all-products-grid');
        } else {
            defContent.style.display = 'block';
            gridTitle.innerText = "Shop All";
            renderAll();
        }
    });
}

// ================= ГЛОБАЛЬНЫЕ UI ФУНКЦИИ =================

window.toggleMenu = () => {
    const menu = document.getElementById('side-menu');
    if(menu) menu.classList.toggle('open');
};

window.toggleCart = () => { 
    const cartDrawer = document.getElementById('cart-drawer');
    if(cartDrawer) {
        cartDrawer.classList.toggle('open'); 
        renderCart(); 
    }
};

window.openPage = (id) => { 
    const page = document.getElementById(id);
    if(page) {
        page.style.display = 'block'; 
        if(id === 'wish-page') renderWishlist();
    }
};

window.closePage = (id) => {
    const page = document.getElementById(id);
    if(page) page.style.display = 'none';
};

window.toggleAcc = (id) => { 
    const el = document.getElementById(id); 
    if(el) el.style.display = el.style.display === 'block' ? 'none' : 'block'; 
};

window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    if (p) { 
        cart.push(p); 
        updateCounters(); 
        tg?.HapticFeedback.impactOccurred('medium'); 
    }
};

window.addToWishlist = (id) => {
    if (!wishlist.find(x => x.id === id)) {
        const p = products.find(x => x.id === id);
        if(p) {
            wishlist.push(p);
            updateCounters();
        }
    }
};

window.showInfoPage = (id) => { 
    window.openPage(id + '-page'); 
    window.toggleMenu(); 
};

function updateCounters() {
    const wCount = document.getElementById('w-count');
    const cCount = document.getElementById('c-count');
    if(wCount) wCount.innerText = wishlist.length;
    if(cCount) cCount.innerText = cart.length;
}

function renderCart() {
    const list = document.getElementById('cart-items-list');
    if(!list) return;
    list.innerHTML = cart.map((p, i) => `
        <div class="wish-item">
            <img src="${p.image}">
            <b>${p.name}</b>
            <span>${p.price} AED</span>
        </div>
    `).join('');
    const totalEl = document.getElementById('cart-total-price');
    if(totalEl) totalEl.innerText = cart.reduce((s, p) => s + p.price, 0);
}

function renderWishlist() {
    const container = document.getElementById('wish-list-container');
    if(!container) return;
    container.innerHTML = wishlist.map(p => `
        <div class="wish-item">
            <img src="${p.image}">
            <p>${p.name}</p>
        </div>
    `).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    if (tg) {
        tg.ready();
        tg.expand();
    }
    loadDataFromFirebase();
});
