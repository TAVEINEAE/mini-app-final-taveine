import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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
    const page = link.dataset.page;
    if(!page) return;
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(`${page}-page`).classList.remove("hidden");
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

window.logout = () => signOut(auth);

// --- PRODUCT LOGIC ---
window.addProduct = async () => {
  const name = document.getElementById("p-name").value;
  const price = document.getElementById("p-price").value;
  if(!name || !price) return alert("Please fill all fields");
  
  await addDoc(collection(db, "products"), {
    name, 
    price: Number(price),
    createdAt: Date.now()
  });
  
  document.getElementById("p-name").value = "";
  document.getElementById("p-price").value = "";
  loadProducts();
};

async function loadProducts() {
  const list = document.getElementById("products-list");
  if(!list) return;
  
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  
  list.innerHTML = "";
  snap.forEach(d => {
    const p = d.data();
    const item = document.createElement("div");
    item.className = "product-item";
    item.innerHTML = `
      <div>
        <span style="font-weight:600">${p.name}</span>
        <span style="color:var(--primary); margin-left:15px;">${p.price} AED</span>
      </div>
      <div>
        <button class="btn-action btn-edit" onclick="openEditModal('${d.id}', '${p.name}', ${p.price})"><i class="fas fa-edit"></i></button>
        <button class="btn-action btn-delete" onclick="deleteProduct('${d.id}')"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    list.appendChild(item);
  });
}

window.deleteProduct = async (id) => {
  if(confirm("Delete this product?")) {
    await deleteDoc(doc(db, "products", id));
    loadProducts();
  }
};

// --- EDIT MODAL ---
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
  const price = Number(document.getElementById("edit-price").value);
  
  await updateDoc(doc(db, "products", id), { name, price });
  closeEditModal(); // Окно исчезает после сохранения
  loadProducts();
};

// --- CHART ---
function initChart() {
  const ctx = document.getElementById('salesChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Sep 07', 'Sep 08', 'Sep 09', 'Sep 10', 'Sep 11', 'Sep 12', 'Sep 13'],
      datasets: [
        { 
          label: 'Order', 
          data: [5, 8, 4, 7, 3, 6, 5], 
          borderColor: '#006d5b', 
          tension: 0.4, 
          fill: true, 
          backgroundColor: 'rgba(0,109,91,0.1)' 
        },
        { 
          label: 'Income Growth', 
          data: [3, 5, 7, 5, 8, 4, 9], 
          borderColor: '#808191', 
          borderDash: [5, 5], 
          tension: 0.4 
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
    }
  });
}
