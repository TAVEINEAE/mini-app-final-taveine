// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
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

let activeChatId = null;
const messagesStore = {};

// Navigation
document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', () => {
    const page = el.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');

    document.querySelectorAll('.category, .nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll(`[data-page="${page}"]`).forEach(i => i.classList.add('active'));
  });
});

onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = "login.html";
  loadProducts();
  initChat();
});

async function loadProducts() {
  const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));

  document.getElementById("dash-products").textContent = snap.size;

  const popular = document.getElementById("popular-products");
  popular.innerHTML = "";

  snap.forEach(doc => {
    const p = doc.data();
    popular.innerHTML += `
      <div class="product-card">
        <img class="product-img" src="${p.image || 'https://via.placeholder.com/300x200'}" alt="${p.name}">
        <div class="favorite"><i class="far fa-heart"></i></div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price">${p.price} AED</div>
        </div>
      </div>
    `;
  });

  const inventory = document.getElementById("inventory-list");
  inventory.innerHTML = popular.innerHTML; // пока одинаковый список
}

window.addProduct = async () => {
  const name = document.getElementById('p-name').value.trim();
  const price = Number(document.getElementById('p-price').value);

  if (!name || !price) return alert("Name and price required");

  await addDoc(collection(db, "products"), {
    name, price,
    createdAt: serverTimestamp()
  });

  alert("Product added!");
  loadProducts();
};

function initChat() {
  onChildAdded(ref(rtdb, 'messages'), snap => {
    const m = snap.val();
    if (!m?.chat_id) return;

    if (!messagesStore[m.chat_id]) messagesStore[m.chat_id] = { name: m.name || 'Customer', msgs: [] };
    messagesStore[m.chat_id].msgs.push(m);

    document.getElementById('dash-users').textContent = Object.keys(messagesStore).length;
    document.getElementById('real-users-count').textContent = Object.keys(messagesStore).length;
  });
}

window.sendMessage = () => {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text) return;

  push(ref(rtdb, 'messages'), {
    chat_id: "demo-chat",
    text,
    sender: 'admin',
    timestamp: Date.now()
  });

  input.value = '';
};