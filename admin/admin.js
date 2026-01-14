import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getDatabase, ref, onChildAdded, push } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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

let currentChatId = null;
const allMessages = {};

// --- AUTH & INIT ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("auth-status").innerText = user.email;
    loadProducts();
    initChat();
    initChart();
  } else { window.location.href = "login.html"; }
});

window.logout = () => signOut(auth);

// --- PRODUCT MAGIC (Categories & Groups) ---
window.addProduct = async () => {
  const p = {
    name: document.getElementById("p-name").value,
    price: Number(document.getElementById("p-price").value),
    category: document.getElementById("p-category").value || "Other",
    image: document.getElementById("p-image").value || "https://via.placeholder.com/200",
    tags: document.getElementById("p-tags").value,
    createdAt: Date.now()
  };
  if(!p.name || !p.price) return alert("Fill Name and Price!");
  await addDoc(collection(db, "products"), p);
  loadProducts();
  ["p-name","p-price","p-category","p-image","p-tags"].forEach(id => document.getElementById(id).value="");
};

async function loadProducts() {
  const container = document.getElementById("products-container");
  const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
  const groups = {};
  
  snap.forEach(d => {
    const data = d.data();
    if(!groups[data.category]) groups[data.category] = [];
    groups[data.category].push({id: d.id, ...data});
  });

  document.getElementById("total-p-count").innerText = snap.size;
  container.innerHTML = Object.keys(groups).map(cat => `
    <div class="category-block">
      <div class="category-header"><i class="fas fa-tag"></i> ${cat}</div>
      <div class="product-grid">
        ${groups[cat].map(p => `
          <div class="product-card">
            <img src="${p.image}" class="p-img">
            <div class="p-body">
              ${p.tags ? `<span class="p-tag">${p.tags}</span>` : ''}
              <div style="font-weight:700; font-size:14px; margin-top:5px;">${p.name}</div>
              <div style="color:var(--primary); font-weight:800; margin:5px 0;">${p.price} AED</div>
              <div style="display:flex; gap:10px;">
                <button onclick="openEdit('${p.id}','${p.name}',${p.price})" style="flex:1; padding:5px; border-radius:5px; border:1px solid #ddd; background:#fff; cursor:pointer;"><i class="fa fa-edit"></i></button>
                <button onclick="deleteP('${p.id}')" style="flex:1; padding:5px; border-radius:5px; border:none; background:#fff0f0; color:red; cursor:pointer;"><i class="fa fa-trash"></i></button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

window.deleteP = async (id) => { if(confirm("Delete?")) { await deleteDoc(doc(db, "products", id)); loadProducts(); } };

// --- MODAL FIX ---
window.openEdit = (id, n, p) => {
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-name").value = n;
  document.getElementById("edit-price").value = p;
  document.getElementById("edit-modal").style.display = "flex";
};
window.closeModal = () => document.getElementById("edit-modal").style.display = "none";
window.updateProduct = async () => {
  const id = document.getElementById("edit-id").value;
  await updateDoc(doc(db, "products", id), {
    name: document.getElementById("edit-name").value,
    price: Number(document.getElementById("edit-price").value)
  });
  closeModal(); loadProducts();
};

// --- TELEGRAM CHAT (Original) ---
function initChat() {
  onChildAdded(ref(rtdb, 'messages'), (snap) => {
    const m = snap.val();
    if(!allMessages[m.chat_id]) {
      allMessages[m.chat_id] = { name: m.name, msgs: [] };
      renderChatSidebar();
    }
    allMessages[m.chat_id].msgs.push(m);
    if(currentChatId === m.chat_id) renderMessages();
  });
}

function renderChatSidebar() {
  const list = document.getElementById("chat-list");
  list.innerHTML = Object.keys(allMessages).map(id => `
    <div onclick="selectChat('${id}')" style="padding:15px; border-bottom:1px solid #eee; cursor:pointer; background:${currentChatId===id?'#f0f7f6':''}">
      <b>${allMessages[id].name}</b><br><small style="color:gray;">ID: ${id}</small>
    </div>
  `).join('');
}

window.selectChat = (id) => {
  currentChatId = id;
  document.getElementById("active-chat-user").innerText = "Chat with: " + allMessages[id].name;
  renderMessages(); renderChatSidebar();
};

function renderMessages() {
  const box = document.getElementById("chat-box");
  box.innerHTML = allMessages[currentChatId].msgs.map(m => `
    <div class="${m.sender === 'admin' ? 'm-admin' : 'm-bot'}">${m.text}</div>
  `).join('');
  box.scrollTop = box.scrollHeight;
}

window.sendMessage = async () => {
  const input = document.getElementById("reply-input");
  if(!input.value || !currentChatId) return;
  const text = input.value;
  fetch(`${GAS_URL}?chatId=${currentChatId}&text=${encodeURIComponent(text)}`, { mode: 'no-cors' });
  await push(ref(rtdb, 'messages'), { chat_id: currentChatId, text, sender: 'admin', timestamp: Date.now() });
  input.value = "";
};

// --- CHART ---
function initChart() {
  const ctx = document.getElementById('mainChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ label: 'Sales', data: [1200, 1900, 1500, 2500, 2200, 3000, 2800], borderColor: '#006d5b', tension: 0.4, fill: true, backgroundColor: 'rgba(0,109,91,0.05)' }]
    },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}

// --- NAVIGATION ---
document.querySelectorAll(".nav-link").forEach(link => {
  link.onclick = () => {
    const page = link.dataset.page; if(!page) return;
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.querySelectorAll(".nav-link").forEach(n => n.classList.remove("active"));
    document.getElementById(page + "-page").classList.remove("hidden");
    link.classList.add("active");
    document.getElementById("page-title").innerText = page.charAt(0).toUpperCase() + page.slice(1);
  };
});
