import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getDatabase, ref, onChildAdded, push, limitToLast, query as dbQuery } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz7z0ZRjek0gTPWf4FG55mWSh1uBEpgrsgx0B6WUw6xvbjs9T04dWnTVZI-vaJA6BctDw/exec";
let currentChatId = null;
const chats = {};

// --- AUTH ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("auth-status").innerText = user.email;
    loadProducts();
    initChart();
    initChatListener();
  } else {
    window.location.href = "./login.html";
  }
});

window.logout = () => signOut(auth).then(() => window.location.href = "./login.html");

// --- PRODUCTS LOGIC (Add, Delete, Edit) ---
window.addProduct = async () => {
  const name = document.getElementById("p-name").value;
  const price = Number(document.getElementById("p-price").value);
  const category = document.getElementById("p-category").value;
  const image = document.getElementById("p-image").value;
  if(!name || !price) return alert("Fill name and price");
  await addDoc(collection(db, "products"), { name, price, category, image, createdAt: Date.now() });
  loadProducts();
  ["p-name", "p-price", "p-category", "p-image"].forEach(id => document.getElementById(id).value = "");
};

async function loadProducts() {
  const list = document.getElementById("products-list");
  const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
  document.getElementById("productsCount").innerText = snap.size;
  list.innerHTML = "";
  snap.forEach(docSnap => {
    const p = docSnap.data();
    const id = docSnap.id;
    const div = document.createElement("div");
    div.className = "product-item";
    div.innerHTML = `
      <div><strong>${p.name}</strong><br><small>${p.category}</small></div>
      <div>
        <span style="font-weight:bold; margin-right:15px;">${p.price} AED</span>
        <button onclick="openEditModal('${id}', '${p.name}', ${p.price}, '${p.category}')" style="color:var(--primary); border:none; background:none; cursor:pointer; margin-right:10px;"><i class="fas fa-edit"></i></button>
        <button onclick="deleteProduct('${id}')" style="color:red; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
      </div>`;
    list.appendChild(div);
  });
}

window.deleteProduct = async (id) => { if(confirm("Delete?")) { await deleteDoc(doc(db, "products", id)); loadProducts(); } };

// --- EDIT FUNCTION ---
window.openEditModal = (id, name, price, category) => {
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-name").value = name;
  document.getElementById("edit-price").value = price;
  document.getElementById("edit-category").value = category;
  document.getElementById("edit-modal").style.display = "flex";
};

window.updateProduct = async () => {
  const id = document.getElementById("edit-id").value;
  const data = {
    name: document.getElementById("edit-name").value,
    price: Number(document.getElementById("edit-price").value),
    category: document.getElementById("edit-category").value
  };
  await updateDoc(doc(db, "products", id), data);
  document.getElementById("edit-modal").style.display = "none";
  loadProducts();
};

// --- CHAT LOGIC ---
function initChatListener() {
  onChildAdded(dbQuery(ref(rtdb, 'messages'), limitToLast(50)), (snap) => {
    const data = snap.val();
    const cid = data.chat_id;
    if (!chats[cid]) { chats[cid] = { name: data.name, messages: [] }; renderChatList(); }
    chats[cid].messages.push(data);
    if (currentChatId === cid) renderMessages(cid);
  });
}

function renderChatList() {
  const list = document.getElementById("chats-list");
  list.innerHTML = "";
  Object.keys(chats).forEach(cid => {
    const div = document.createElement("div");
    div.className = `chat-item ${currentChatId === cid ? 'active' : ''}`;
    div.style.padding = "15px"; div.style.cursor = "pointer";
    div.innerHTML = `<strong>${chats[cid].name}</strong>`;
    div.onclick = () => { currentChatId = cid; renderMessages(cid); document.getElementById("current-chat-name").innerText = chats[cid].name; };
    list.appendChild(div);
  });
}

function renderMessages(cid) {
  const box = document.getElementById("chat-box");
  box.innerHTML = chats[cid].messages.map(m => `<div class="msg ${m.sender}">${m.text}</div>`).join("");
  box.scrollTop = box.scrollHeight;
}

window.sendReply = async () => {
  const input = document.getElementById("reply-input");
  if (!input.value || !currentChatId) return;
  const msg = { chat_id: currentChatId, name: "Admin", text: input.value, sender: "admin", timestamp: Date.now() };
  fetch(`${GOOGLE_SCRIPT_URL}?chatId=${currentChatId}&text=${encodeURIComponent(input.value)}`, { mode: 'no-cors' });
  await push(ref(rtdb, 'messages'), msg);
  input.value = "";
};

// --- NAVIGATION & CHART ---
document.querySelectorAll(".nav-link").forEach(link => {
  link.onclick = () => {
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(`${link.dataset.page}-page`).classList.remove("hidden");
  }
});

function initChart() {
  const ctx = document.getElementById('salesChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ data: [12, 19, 15, 25, 22, 30, 28], borderColor: '#006d5b', tension: 0.4, fill: true, backgroundColor: 'rgba(0,109,91,0.1)' }]
    },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}
