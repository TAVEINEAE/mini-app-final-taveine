import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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

// --- NAVIGATION ---
document.querySelectorAll(".nav-link").forEach(link => {
  link.onclick = () => {
    if(!link.dataset.page) return;
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(`${link.dataset.page}-page`).classList.remove("hidden");
  };
});

// --- AUTH ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("auth-status").innerText = user.email;
    loadProducts();
    initChart();
  } else {
    window.location.href = "./login.html";
  }
});

window.logout = () => signOut(auth).then(() => window.location.href = "./login.html");

// --- PRODUCT LOGIC ---
window.addProduct = async () => {
  const name = document.getElementById("p-name").value;
  const price = document.getElementById("p-price").value;
  if(!name || !price) return;
  await addDoc(collection(db, "products"), { name, price: Number(price), createdAt: Date.now() });
  loadProducts();
  document.getElementById("p-name").value = "";
  document.getElementById("p-price").value = "";
};

async function loadProducts() {
  const list = document.getElementById("products-list");
  const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
  list.innerHTML = "";
  snap.forEach(d => {
    const p = d.data();
    const row = document.createElement("div");
    row.className = "product-row";
    row.innerHTML = `<span>${p.name} - <b>${p.price} AED</b></span>
      <div>
        <button onclick="openEditModal('${d.id}', '${p.name}', ${p.price})" style="color:blue; border:none; background:none; cursor:pointer; margin-right:10px;"><i class="fa fa-edit"></i></button>
        <button onclick="deleteProduct('${d.id}')" style="color:red; border:none; background:none; cursor:pointer;"><i class="fa fa-trash"></i></button>
      </div>`;
    list.appendChild(row);
  });
}

window.deleteProduct = async (id) => {
  if(confirm("Delete?")) { await deleteDoc(doc(db, "products", id)); loadProducts(); }
};

// --- MODAL FIXES ---
window.openEditModal = (id, name, price) => {
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-name").value = name;
  document.getElementById("edit-price").value = price;
  document.getElementById("edit-modal").style.display = "flex";
};

window.closeEditModal = () => {
  document.getElementById("edit-modal").style.display = "none";
};

window.updateProduct = async () => {
  const id = document.getElementById("edit-id").value;
  const name = document.getElementById("edit-name").value;
  const price = document.getElementById("edit-price").value;
  await updateDoc(doc(db, "products", id), { name, price: Number(price) });
  closeEditModal(); // Окно исчезает
  loadProducts();
};

// --- CHART ---
function initChart() {
  const ctx = document.getElementById('salesChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ data: [10, 15, 8, 20, 18, 25, 22], borderColor: '#006d5b', tension: 0.4, fill: true, backgroundColor: 'rgba(0,109,91,0.05)' }]
    },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false } } } }
  });
}
