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
    } catch (e) { console.error(e); }
}

function renderProductCard(p) {
    const inWishlist = wishlist.some(item => item.id === p.id);
    return `
        <div class="uniform-card" onclick="openProductDetail('${p.id}')">
            <button class="wish-btn-overlay ${inWishlist ? 'active' : ''}" 
                    onclick="event.stopPropagation(); toggleWishlist('${p.id}')">
                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
            <div class="card-image-wrapper">
                <img src="${p.image || ''}" loading="lazy">
            </div>
            <div class="card-info">
                <h4>${p.name}</h4>
                <div class="price">${Number(p.price).toFixed(0)} AED</div>
                <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.id}')">Add to Cart</button>
            </div>
        </div>
    `;
}

function renderMainPage() {
    const sections = ['new', 'birthday', 'bestseller', 'luxury'];
    sections.forEach(tag => {
        const container = document.getElementById(`${tag}-slider`);
        if (container) {
            container.innerHTML = products.filter(p => p.tags?.includes(tag)).map(renderProductCard).join('');
        }
    });
    document.getElementById('all-products-grid').innerHTML = products.map(renderProductCard).join('');
}

window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const item = cart.find(i => i.id === id);
    if (item) item.qty++; else cart.push({ ...p, qty: 1 });
    localStorage.setItem('taveine_cart', JSON.stringify(cart));
    tg?.HapticFeedback?.notificationOccurred('success');
    alert('Added to cart!');
};

window.toggleWishlist = (id) => {
    const idx = wishlist.findIndex(item => item.id === id);
    if (idx === -1) {
        const p = products.find(p => p.id === id);
        if (p) wishlist.push(p);
    } else wishlist.splice(idx, 1);
    localStorage.setItem('taveine_wishlist', JSON.stringify(wishlist));
    renderMainPage();
};

window.openProductDetail = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('product-detail-content').innerHTML = `
        <img src="${p.image}" style="width:100%; aspect-ratio:1; object-fit:cover;">
        <div style="padding:20px;">
            <h1 style="font-family:'Playfair Display';">${p.name}</h1>
            <p style="color:var(--gold); font-size:1.5rem; margin:10px 0;">${p.price} AED</p>
            <p style="opacity:0.8;">${p.description || ''}</p>
            <button class="add-btn" style="padding:15px; margin-top:20px; font-size:1rem;" onclick="addToCart('${p.id}')">Add to Cart</button>
        </div>
    `;
    document.getElementById('product-detail').style.display = 'block';
};

window.closeProductDetail = () => document.getElementById('product-detail').style.display = 'none';
window.toggleMenu = () => document.getElementById('side-menu').classList.toggle('active');

document.addEventListener('DOMContentLoaded', init);
