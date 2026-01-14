import { getDatabase, ref, onChildAdded, query as dbQuery, limitToLast } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
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

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("auth-status").innerText = user.email;
    loadProducts();
    initChart(); // Запуск проф. графика
  } else {
    window.location.href = "./login.html";
  }
});

window.logout = async () => { await signOut(auth); window.location.href = "./login.html"; };

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
    div.innerHTML = `
      <div><strong>${p.name}</strong> <br> <small>${p.category}</small></div>
      <div>
        <span style="color:var(--primary); font-weight:700; margin-right:15px;">${p.price} AED</span>
        <button onclick="deleteProduct('${docSnap.id}')" style="color:#cbd5e1; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
      </div>
    `;
    list.appendChild(div);
  });
}

window.deleteProduct = async (id) => {
  if(confirm("Delete?")) { await deleteDoc(doc(db, "products", id)); loadProducts(); }
};

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
      datasets: [{
        label: 'Revenue',
        data: [12, 19, 13, 25, 22, 30, 25],
        borderColor: '#006d5b',
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
    }
  });
}

// NAVIGATION
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(`${link.dataset.page}-page`).classList.remove("hidden");
  });
});

function initChatListener() {
  const chatBox = document.getElementById("chat-box");
  const messagesRef = dbQuery(ref(rtdb, 'messages'), limitToLast(50));

  onChildAdded(messagesRef, (snapshot) => {
    const data = snapshot.val();
    const messageDiv = document.createElement("div");
    
    // Определяем класс в зависимости от отправителя (из вашего GAS скрипта это "client")
    const isClient = data.sender === "client";
    messageDiv.className = `msg ${isClient ? 'client' : 'admin'}`;
    
    messageDiv.innerHTML = `
      <span class="msg-info">${data.name} • ${new Date(data.timestamp).toLocaleTimeString()}</span>
      <div class="msg-text">${data.text}</div>
    `;
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Авто-скролл вниз
  });
}

// Запускаем прослушивание чата при загрузке
initChatListener();
