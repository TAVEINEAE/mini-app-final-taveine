import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getDatabase, ref, onChildAdded, push } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMAds5kqj8BUzOP2OaimC12wUqfkLs9oE",
  authDomain: "taveine-admin.firebaseapp.com",
  projectId: "taveine-admin",
  storageBucket: "taveine-admin.firebasestorage.app",
  messagingSenderId: "916085731146",
  appId: "1:916085731146:web:764187ed408e8c4fdfdbb3",
  databaseURL: "https://taveine-admin-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

let chart = null;
const messagesStore = {};
let activeChatId = null;

// Плавный переход между страницами
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.opacity = '0';
    p.style.transform = 'translateY(20px)';
  });

  const target = document.getElementById(page + '-page');
  target.classList.add('active');
  setTimeout(() => {
    target.style.opacity = '1';
    target.style.transform = 'translateY(0)';
  }, 50);

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.nav-link[data-page="${page}"]`)?.classList.add('active');
}

// Навигация
document.querySelectorAll('.nav-link[data-page]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    switchPage(page);
    document.getElementById('page-title').textContent = link.textContent.trim();
  });
});

// Для мобильной нижней навигации
document.querySelectorAll('.mobile-nav .nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    switchPage(page);
  });
});

onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = "login.html";
  document.getElementById('user-info').textContent = user.email || 'Admin';
  loadAll();
});

window.logout = () => signOut(auth);

async function loadAll() {
  await loadProducts();
  initChat();
}

// ... (остальная часть твоего кода loadProducts, addProduct, initChat и т.д. остаётся без изменений)

async function loadProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    document.getElementById("dash-products").textContent = snap.size;

    const categoriesContainer = document.getElementById("inventory-categories") || document.getElementById("inventory-list");
    categoriesContainer.innerHTML = "";

    const productsByCategory = {};

    snap.forEach(doc => {
      const p = doc.data();
      const category = p.category || "Uncategorized";

      if (!productsByCategory[category]) {
        productsByCategory[category] = [];
      }
      productsByCategory[category].push(p);
    });

    Object.entries(productsByCategory).forEach(([category, products]) => {
      const section = document.createElement("div");
      section.className = "category-section";

      section.innerHTML = `<div class="category-title">${category} (${products.length})</div>`;

      const slider = document.createElement("div");
      slider.className = "category-slider";

      products.forEach(p => {
        slider.innerHTML += `
          <div class="product-card">
            <img class="product-img" src="${p.image || 'https://via.placeholder.com/300x140'}" alt="${p.name}">
            <div class="product-info">
              <div class="product-name">${p.name}</div>
              <div class="product-price">${p.price || '—'} AED</div>
            </div>
          </div>
        `;
      });

      section.appendChild(slider);
      categoriesContainer.appendChild(section);
    });

    if (Object.keys(productsByCategory).length === 0) {
      categoriesContainer.innerHTML = '<p style="text-align:center; color:var(--gray);">No products yet</p>';
    }

  } catch (e) {
    console.error("Products error:", e);
  }
}

// ... (остальные функции initChat, addProduct и т.д. — оставь как были)