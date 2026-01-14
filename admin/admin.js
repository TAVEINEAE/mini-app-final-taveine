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

let productsChart = null;
const messagesStore = {};
let activeChatId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Навигация
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.dataset.page;
      
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(page).classList.add('active');
      
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
});

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  
  document.getElementById('loading').style.display = 'none';
  loadData();
});

function logout() {
  signOut(auth);
}

async function loadData() {
  await loadProducts();
  initChat();
}

async function loadProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    document.getElementById("stat-products").textContent = snap.size;
    
    const container = document.getElementById("inventory-list");
    container.innerHTML = "";
    
    const byDay = {};
    
    snap.forEach(doc => {
      const p = doc.data();
      const date = p.createdAt?.toDate?.() || new Date();
      const day = date.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
      
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img class="product-img" src="${p.image || 'https://via.placeholder.com/300x200'}" alt="${p.name}">
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price">${p.price} AED</div>
        </div>
      `;
      container.appendChild(card);
    });
    
    updateChart(byDay);
  } catch (e) {
    console.error("Ошибка продуктов:", e);
  }
}

function updateChart(byDay) {
  const days = Object.keys(byDay).sort();
  const labels = days.map(d => new Date(d).toLocaleDateString('ru', {day:'numeric', month:'short'}));
  
  if (productsChart) productsChart.destroy();
  
  productsChart = new Chart(document.getElementById('productsChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Товары',
        data: days.map(d => byDay[d]),
        backgroundColor: 'rgba(0,109,91,0.6)',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function addProduct() {
  const name = document.getElementById('name').value.trim();
  const price = Number(document.getElementById('price').value);
  
  if (!name || isNaN(price) || price <= 0) {
    alert("Заполните название и корректную цену");
    return;
  }
  
  addDoc(collection(db, "products"), {
    name,
    price,
    createdAt: serverTimestamp()
  }).then(() => {
    alert("Товар добавлен!");
    document.getElementById('name').value = '';
    document.getElementById('price').value = '';
    loadProducts();
  }).catch(e => alert("Ошибка: " + e.message));
}

// Чат
function initChat() {
  onChildAdded(ref(rtdb, 'messages'), snap => {
    const m = snap.val();
    if (!m?.chat_id) return;
    
    if (!messagesStore[m.chat_id]) {
      messagesStore[m.chat_id] = { name: m.name || 'Клиент', msgs: [] };
    }
    
    messagesStore[m.chat_id].msgs.push(m);
    
    renderChatList();
    if (activeChatId === m.chat_id) renderMessages();
    
    document.getElementById('stat-users').textContent = Object.keys(messagesStore).length;
    document.getElementById('users-count').textContent = Object.keys(messagesStore).length;
  });
}

function renderChatList() {
  const list = document.getElementById('chat-list');
  list.innerHTML = '';
  
  Object.entries(messagesStore).forEach(([id, chat]) => {
    const item = document.createElement('div');
    item.className = 'chat-item' + (activeChatId === id ? ' active' : '');
    item.innerHTML = `<strong>${chat.name}</strong>`;
    item.onclick = () => {
      activeChatId = id;
      document.getElementById('chat-header').textContent = chat.name;
      renderMessages();
      renderChatList();
    };
    list.appendChild(item);
  });
}

function renderMessages() {
  const box = document.getElementById('chat-messages');
  box.innerHTML = '';
  
  if (!activeChatId) return;
  
  messagesStore[activeChatId].msgs.forEach(m => {
    const div = document.createElement('div');
    div.className = `message ${m.sender === 'admin' ? 'admin' : 'user'}`;
    div.textContent = m.text;
    box.appendChild(div);
  });
  
  box.scrollTop = box.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text || !activeChatId) return;
  
  push(ref(rtdb, 'messages'), {
    chat_id: activeChatId,
    text,
    sender: 'admin',
    timestamp: Date.now()
  });
  
  input.value = '';
}