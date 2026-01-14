// Firebase imports (версия 10 — более стабильная и меньше размер)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getDatabase, ref, onChildAdded, push } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

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

const GAS_URL = "https://script.google.com/macros/s/AKfycbz7z0ZRjek0gTPWf4FG55mWSh1uBEpgrsgx0B6WUw6xvbjs9T04dWnTVZI-vaJA6BctDw/exec";

// State
let productsChart = null;
const messagesStore = {};
let activeChatId = null;

// Auth & Navigation
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("auth-status").innerHTML = `<small>Signed in as</small><br>${user.email}`;
  loadAllData();
});

document.querySelectorAll('.nav-link[data-page]').forEach(link => {
  link.addEventListener('click', () => {
    const page = link.dataset.page;

    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(page + '-page').classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    link.classList.add('active');

    document.getElementById('page-title').textContent = link.textContent.trim();
  });
});

window.logout = () => signOut(auth).then(() => location.href = "login.html");

// Products
window.addProduct = async () => {
  const name     = document.getElementById("p-name").value.trim();
  const priceStr = document.getElementById("p-price").value.trim();
  const category = document.getElementById("p-category").value.trim();
  const image    = document.getElementById("p-image").value.trim();
  const tags     = document.getElementById("p-tags").value.trim();

  if (!name || !priceStr) {
    alert("Name and Price are required!");
    return;
  }

  const price = Number(priceStr);
  if (isNaN(price) || price <= 0) {
    alert("Enter correct price!");
    return;
  }

  try {
    await addDoc(collection(db, "products"), {
      name,
      price,
      category: category || null,
      image: image || null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      createdAt: serverTimestamp()
    });

    alert("Product added successfully!");
    clearProductForm();
    loadProducts();
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
};

function clearProductForm() {
  ["p-name","p-price","p-category","p-image","p-tags"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

async function loadProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    document.getElementById("dash-products").textContent = snap.size;

    const container = document.getElementById("inventory-list");
    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = '<div style="padding:40px; color:#64748b; text-align:center; width:100%;">No products yet</div>';
      return;
    }

    const productsByDay = {};

    snap.forEach(doc => {
      const p = doc.data();
      const date = p.createdAt?.toDate?.() || new Date(p.createdAt || Date.now());
      const dayKey = date.toISOString().split('T')[0];

      productsByDay[dayKey] = (productsByDay[dayKey] || 0) + 1;

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img class="product-img" src="${p.image || 'https://via.placeholder.com/300x220?text=No+Image'}" 
             onerror="this.src='https://via.placeholder.com/300x220?text=Error'" alt="${p.name}">
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price">${p.price.toLocaleString('ru-RU')} AED</div>
        </div>
      `;
      container.appendChild(card);
    });

    updateProductsChart(productsByDay);
  } catch (err) {
    console.error("Products load error:", err);
  }
}

function updateProductsChart(byDay) {
  const sortedDays = Object.keys(byDay).sort();
  const labels = sortedDays.map(d => new Date(d).toLocaleDateString('ru-RU', {day:'numeric', month:'short'}));
  const data = sortedDays.map(d => byDay[d]);

  if (productsChart) productsChart.destroy();

  productsChart = new Chart(document.getElementById('productsChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Products added',
        data,
        backgroundColor: 'rgba(0, 109, 91, 0.65)',
        borderColor: 'rgba(0, 109, 91, 0.9)',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

// Chat & Customers
function initChat() {
  onChildAdded(ref(rtdb, 'messages'), snap => {
    const msg = snap.val();
    if (!msg?.chat_id) return;

    if (!messagesStore[msg.chat_id]) {
      messagesStore[msg.chat_id] = {
        name: msg.name || "Unknown",
        username: msg.username || null,
        msgs: []
      };
    }

    messagesStore[msg.chat_id].msgs.push(msg);

    if (activeChatId === msg.chat_id) {
      renderMessages();
    } else {
      updateChatList();
    }

    updateCustomerCount();
  });
}

function updateChatList() {
  const container = document.getElementById("chat-list");
  container.innerHTML = "";

  Object.entries(messagesStore)
    .sort(([,a], [,b]) => (b.msgs.at(-1)?.timestamp || 0) - (a.msgs.at(-1)?.timestamp || 0))
    .forEach(([id, chat]) => {
      const lastMsg = chat.msgs.at(-1);
      const item = document.createElement("div");
      item.className = "chat-item";
      if (id === activeChatId) item.classList.add("active");

      item.innerHTML = `
        <strong>${chat.name}</strong>
        ${chat.username ? `<small>@${chat.username}</small>` : ''}
        ${lastMsg ? `<div style="margin-top:4px; font-size:0.82rem; color:#64748b;">
          ${lastMsg.sender === 'admin' ? 'You: ' : ''}${lastMsg.text.substring(0,40)}${lastMsg.text.length>40?'...':''}
        </div>` : ''}
      `;

      item.onclick = () => selectChat(id);
      container.appendChild(item);
    });
}

window.selectChat = id => {
  activeChatId = id;
  document.getElementById("active-chat-header").textContent = 
    messagesStore[id]?.name || "Chat #" + id;

  updateChatList();
  renderMessages();
};

function renderMessages() {
  if (!activeChatId || !messagesStore[activeChatId]) return;

  const container = document.getElementById("chat-box");
  container.innerHTML = "";

  messagesStore[activeChatId].msgs.forEach(m => {
    const div = document.createElement("div");
    div.className = `message ${m.sender === 'admin' ? 'admin' : 'user'}`;
    div.textContent = m.text;
    container.appendChild(div);
  });

  container.scrollTop = container.scrollHeight;
}

window.sendMessage = async () => {
  const input = document.getElementById("reply-input");
  const text = input.value.trim();
  if (!text || !activeChatId) return;

  const msg = {
    chat_id: activeChatId,
    text,
    sender: 'admin',
    timestamp: Date.now(),
    name: "Admin"
  };

  try {
    fetch(`${GAS_URL}?chatId=${activeChatId}&text=${encodeURIComponent(text)}`, { mode: 'no-cors' });
    await push(ref(rtdb, 'messages'), msg);
    input.value = "";
  } catch (err) {
    console.error("Send failed", err);
  }
};

function updateCustomerCount() {
  const count = Object.keys(messagesStore).length;
  document.getElementById("dash-users").textContent = count;
  document.getElementById("real-users-count").textContent = count;
}

// Init
async function loadAllData() {
  await Promise.all([
    loadProducts()
  ]);
  initChat();
  updateCustomerCount();
}