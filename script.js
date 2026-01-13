// ================= FIREBASE SETUP =================
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

// ================= GLOBAL STATE =================
const tg = window.Telegram?.WebApp;
let products = []; // Сюда загрузим товары из базы
let cart = [];
let wishlist = [];

// ================= LOAD DATA FROM FIREBASE =================
async function loadDataFromFirebase() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });

        console.log("Products loaded:", products);
        renderAll(); // Рисуем интерфейс после загрузки
    } catch (e) {
        console.error("Error loading products: ", e);
    }
}

// ================= RENDER LOGIC =================
function renderAll() {
    renderSliders();
    renderGrid(products, 'all-products-grid');
}

function renderSliders() {
    // Фильтруем по тегам, которые ты вводишь в админке
    renderGrid(products.filter(p => p.tags && p.tags.includes('new')).slice(0, 4), 'new-slider');
    renderGrid(products.filter(p => p.tags && p.tags.includes('sale')).slice(0, 4), 'sale-slider');
    renderGrid(products.filter(p => p.tags && p.tags.includes('popular')).slice(0, 4), 'popular-slider');
}

function renderGrid(list, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    if (list.length === 0) {
        grid.innerHTML = "<p style='padding:20px; color:gray;'>No products found here yet.</p>";
        return;
    }

    grid.innerHTML = list.map(p => `
        <div class="card">
            <button class="wish-btn" onclick="window.addToWishlist('${p.id}')">❤</button>
            <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}">
            <h4>${p.name}</h4>
            <b>${p.price} AED</b>
            <button class="add-btn" onclick="window.addToCart('${p.id}')" style="background:var(--green); color:#fff; border:none; padding:8px; width:90%; border-radius:3px; cursor:pointer;">Add to Cart</button>
        </div>
    `).join('');
}

// ================= ACTIONS =================

window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    if (p) {
        cart.push(p);
        updateCounters();
        tg?.HapticFeedback?.impactOccurred('medium');
    }
};

window.addToWishlist = (id) => {
    if (!wishlist.find(x => x.id === id)) {
        wishlist.push(products.find(x => x.id === id));
        updateCounters();
        alert('Added to wishlist!');
    }
};

window.openCategoryPage = (cat) => {
    document.getElementById('cat-title').innerText = cat;
    // В админке мы сохраняем категорию в поле category
    const filtered = products.filter(p => p.category === cat);
    renderGrid(filtered, 'category-grid');
    window.openPage('category-page');
    window.toggleMenu();
};

// ================= UI FUNCTIONS =================

window.renderCart = () => {
    const list = document.getElementById('cart-items-list');
    list.innerHTML = cart.map((item, idx) => `
        <div class="wish-item">
            <img src="${item.image}">
            <div>
                <p>${item.name}</p>
                <b>${item.price} AED</b>
            </div>
            <button onclick="window.removeFromCart(${idx})" style="margin-left:auto; background:none; border:none; color:white; font-size:18px;">✕</button>
        </div>
    `).join('');
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cart-total-price').innerText = total;
};

window.removeFromCart = (idx) => {
    cart.splice(idx, 1);
    window.renderCart();
    updateCounters();
};

function updateCounters() {
    document.getElementById('w-count').innerText = wishlist.length;
    document.getElementById('c-count').innerText = cart.length;
}

// Системные функции (сделаны глобальными для HTML)
window.toggleMenu = () => { document.getElementById('side-menu').classList.toggle('open'); };
window.toggleCart = () => { 
    document.getElementById('cart-drawer').classList.toggle('open'); 
    window.renderCart(); 
};
window.toggleAcc = (id) => { 
    const el = document.getElementById(id); 
    el.style.display = el.style.display === 'block' ? 'none' : 'block'; 
};
window.openPage = (id) => { 
    document.getElementById(id).style.display = 'block'; 
    if(id === 'wish-page') renderWishlist();
};
window.closePage = (id) => { document.getElementById(id).style.display = 'none'; };

function renderWishlist() {
    const container = document.getElementById('wish-list-container');
    container.innerHTML = wishlist.map((p, idx) => `
        <div class="wish-item">
            <img src="${p.image}">
            <div><p>${p.name}</p><b>${p.price} AED</b></div>
            <button onclick="wishlist.splice(${idx},1); renderWishlist(); updateCounters();" style="margin-left:auto; background:none; border:none; color:white;">✕</button>
        </div>
    `).join('');
}

// ================= INITIALIZE =================
document.addEventListener("DOMContentLoaded", () => {
    if (tg) {
        tg.ready();
        tg.expand();
    }
    loadDataFromFirebase();
});
