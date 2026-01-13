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
let cart = [];
let wishlist = [];

// ЗАГРУЗКА
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

// ПОИСК
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

// ГЛОБАЛЬНЫЕ ФУНКЦИИ
window.toggleMenu = () => document.getElementById('side-menu').classList.toggle('open');
window.toggleCart = () => { document.getElementById('cart-drawer').classList.toggle('open'); renderCart(); };
window.openPage = (id) => { document.getElementById(id).style.display = 'block'; if(id==='wish-page') renderWishlist(); };
window.closePage = (id) => document.getElementById(id).style.display = 'none';
window.toggleAcc = (id) => { const el = document.getElementById(id); el.style.display = el.style.display==='block'?'none':'block'; };

window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    if (p) { cart.push(p); updateCounters(); tg?.HapticFeedback.impactOccurred('medium'); }
};

window.addToWishlist = (id) => {
    if (!wishlist.find(x => x.id === id)) {
        wishlist.push(products.find(x => x.id === id));
        updateCounters();
    }
};

window.openCategoryPage = (cat) => {
    document.getElementById('cat-title').innerText = cat;
    renderGrid(products.filter(p => p.category === cat), 'category-grid');
    window.openPage('category-page');
    window.toggleMenu();
};

window.showInfoPage = (id) => { window.openPage(id + '-page'); window.toggleMenu(); };

function updateCounters() {
    document.getElementById('w-count').innerText = wishlist.length;
    document.getElementById('c-count').innerText = cart.length;
}

function renderCart() {
    const list = document.getElementById('cart-items-list');
    list.innerHTML = cart.map((p, i) => `<div class="wish-item"><img src="${p.image}"><b>${p.name}</b><span>${p.price} AED</span></div>`).join('');
    document.getElementById('cart-total-price').innerText = cart.reduce((s, p) => s + p.price, 0);
}

function renderWishlist() {
    document.getElementById('wish-list-container').innerHTML = wishlist.map(p => `<div class="wish-item"><img src="${p.image}"><p>${p.name}</p></div>`).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    tg?.ready();
    loadDataFromFirebase();
});
