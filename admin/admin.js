import { getDatabase, ref, onChildAdded, query as dbQuery, limitToLast, push, set } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMAds5kqj8BUzOP2OaimC12wUqfkLs9oE",
  authDomain: "taveine-admin.firebaseapp.com",
  projectId: "taveine-admin",
  storageBucket: "taveine-admin.firebasestorage.app",
  messagingSenderId: "916085731146",
  appId: "1:916085731146:web:764187ed408e8c4fdfdbb3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
let salesChart = null;

// ЧАТ-ПЕРЕМЕННЫЕ
let currentChatId = null;
const chats = {}; 

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("auth-status").innerText = user.email;
    loadProducts();
    initChart();
    initChatListener(); // Запуск чата только после авторизации
  } else {
    window.location.href = "./login.html";
  }
});

window.logout = async () => { await signOut(auth); window.location.href = "./login.html"; };

// --- ТОВАРЫ ---
window.addProduct = async () => {
  const name = document.getElementById("p-name").value.trim();
  const price = Number(document.getElementById("p-price").value);
  const category = document.getElementById("p-category").value.trim();
  const image = document.getElementById("p-image").value.trim();
  const tags = document.getElementById("p-tags").value.split(",").map(t => t.trim()).filter(Boolean);
  if (!name || !price || !category) return alert("Fill fields!");
  await addDoc(collection(db, "products"), { name, price, category, image, tags, createdAt: Date.now() });
  ["p-name", "p-price", "p-category", "p-image", "p-tags"].forEach(id => document.getElementById(id).value = "");
  loadProducts();
};

async function loadProducts() {
  const list = document.getElementById("products-list");
  const countDisplay = document.getElementById("productsCount");
  const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
  if (countDisplay) countDisplay.innerText = snap.size;
  if (!list) return;
  list.innerHTML = "";
  snap.forEach(docSnap => {
    const p = docSnap.data();
    const div = document.createElement("div");
    div.className = "product-item";
    div.innerHTML = `<div><strong>${p.name}</strong><br><small>${p.category}</small></div><div><span style="color:var(--primary); font-weight:700; margin-right:15px;">${p.price} AED</span><button onclick="deleteProduct('${docSnap.id}')" style="color:#cbd5e1; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button></div>`;
    list.appendChild(div);
  });
}

window.deleteProduct = async (id) => {
  if(confirm("Delete?")) { await deleteDoc(doc(db, "products", id)); loadProducts(); }
};

// --- ГРАФИК ---
function initChart() {
  const ctx = document.getElementById('salesChart').getContext('2d');
  if (salesChart) salesChart.destroy();
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(0, 109, 91, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 109, 91, 0)');
  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ label: 'Revenue', data: [12, 19, 13, 25, 22, 30, 25], borderColor: '#006d5b', backgroundColor: gradient, fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
  });
}

// --- НАВИГАЦИЯ ---
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(`${link.dataset.page}-page`).classList.remove("hidden");
    
    if (link.dataset.page === "messages") {
      document.getElementById("msg-badge").classList.add("hidden");
    }
  });
});

// --- ЛОГИКА ЧАТА (ИСПРАВЛЕННАЯ) ---
function initChatListener() {
  const msgBadge = document.getElementById("msg-badge");
  const messagesRef = dbQuery(ref(rtdb, 'messages'), limitToLast(100));

  onChildAdded(messagesRef, (snapshot) => {
    const data = snapshot.val();
    const cid = data.chat_id;

    if (!chats[cid]) {
      chats[cid] = { name: data.name, messages: [] };
      renderChatList();
    }
    chats[cid].messages.push(data);

    // Уведомление
    const isMessagesPageOpen = !document.getElementById("messages-page").classList.contains("hidden");
    if (data.sender === "client") {
      if (!isMessagesPageOpen || currentChatId !== cid) {
        msgBadge.classList.remove("hidden");
      }
    }

    if (currentChatId === cid) {
      renderMessages(cid);
    }
  });
}

function renderChatList() {
  const list = document.getElementById("chats-list");
  if (!list) return;
  list.innerHTML = "";
  Object.keys(chats).forEach(cid => {
    const div = document.createElement("div");
    div.className = `chat-item ${currentChatId === cid ? 'active' : ''}`;
    div.innerHTML = `<div class="chat-avatar"></div><div class="chat-info"><strong>${chats[cid].name}</strong><p style="font-size:12px; color:#64748b; margin:0">ID: ${cid}</p></div>`;
    div.onclick = () => {
      currentChatId = cid;
      document.getElementById("current-chat-name").innerText = chats[cid].name;
      renderChatList();
      renderMessages(cid);
    };
    list.appendChild(div);
  });
}

function renderMessages(cid) {
  const box = document.getElementById("chat-box");
  if (!box) return;
  box.innerHTML = "";
  chats[cid].messages.forEach(m => {
    const div = document.createElement("div");
    div.className = `msg ${m.sender === 'client' ? 'client' : 'admin'}`;
    div.innerHTML = `<div>${m.text}</div><small style="font-size:10px; opacity:0.6">${new Date(m.timestamp).toLocaleTimeString()}</small>`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

// ФУНКЦИЯ ОТВЕТА (Для кнопки)
window.sendReply = async () => {
  const input = document.getElementById("reply-input");
  const text = input.value.trim();
  if (!text || !currentChatId) return;

  const msgData = {
    chat_id: currentChatId,
    name: "Admin",
    text: text,
    sender: "admin",
    timestamp: Date.now()
  };

  // Сохраняем в Firebase (это отобразится в чате)
  await push(ref(rtdb, 'messages'), msgData);
  input.value = "";
};
