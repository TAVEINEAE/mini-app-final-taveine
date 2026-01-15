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

// Navigation
document.querySelectorAll('.nav-link[data-page]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + '-page').classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    document.getElementById('page-title').textContent = link.textContent.trim();
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

async function loadProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    document.getElementById("dash-products").textContent = snap.size;

    const categoriesContainer = document.getElementById("inventory-categories");
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
    console.error("Products load error:", e);
  }
}

function updateChart(byDay) {
  const days = Object.keys(byDay).sort();
  const labels = days.map(d => new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short' }));

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById('productsChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Products',
        data: days.map(d => byDay[d]),
        backgroundColor: 'rgba(0,109,91,0.6)',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

window.addProduct = async () => {
  const name = document.getElementById('p-name').value.trim();
  const price = Number(document.getElementById('p-price').value);
  const category = document.getElementById('p-category').value.trim();

  if (!name || isNaN(price) || price <= 0) {
    alert("Name and valid price required");
    return;
  }

  try {
    await addDoc(collection(db, "products"), {
      name,
      price,
      category: category || null,
      image: document.getElementById('p-image').value.trim() || null,
      createdAt: serverTimestamp()
    });
    alert("Product added!");
    loadProducts();
  } catch (e) {
    alert("Error: " + e.message);
  }
};

function initChat() {
  onChildAdded(ref(rtdb, 'messages'), snap => {
    const m = snap.val();
    if (!m?.chat_id) return;

    if (!messagesStore[m.chat_id]) messagesStore[m.chat_id] = { name: m.name || 'Customer', msgs: [] };
    messagesStore[m.chat_id].msgs.push(m);

    updateChatList();
    if (activeChatId === m.chat_id) renderMessages();

    const count = Object.keys(messagesStore).length;
    document.getElementById('dash-users').textContent = count;
    document.getElementById('real-users-count').textContent = count;
  });
}

function updateChatList() {
  const list = document.getElementById('chat-list');
  list.innerHTML = "";

  Object.entries(messagesStore).forEach(([id, chat]) => {
    const item = document.createElement('div');
    item.className = `chat-item${activeChatId === id ? ' active' : ''}`;
    item.textContent = chat.name;
    item.onclick = () => {
      activeChatId = id;
      document.getElementById('chat-header').textContent = chat.name;
      renderMessages();
      updateChatList();
    };
    list.appendChild(item);
  });
}

function renderMessages() {
  const box = document.getElementById('chat-messages');
  box.innerHTML = "";

  if (!activeChatId) return;

  messagesStore[activeChatId].msgs.forEach(m => {
    const div = document.createElement('div');
    div.className = `message ${m.sender === 'admin' ? 'admin' : 'user'}`;
    div.textContent = m.text;
    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
}

window.sendMessage = () => {
  const input = document.getElementById('reply-input');
  const text = input.value.trim();
  if (!text || !activeChatId) return;

  push(ref(rtdb, 'messages'), {
    chat_id: activeChatId,
    text,
    sender: 'admin',
    timestamp: Date.now()
  });

  input.value = '';
};