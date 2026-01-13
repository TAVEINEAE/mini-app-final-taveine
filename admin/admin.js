import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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

// AUTH CHECK
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "./index.html"; 
  } else {
    const status = document.getElementById("auth-status");
    if (status) status.innerText = `Admin: ${user.email}`;
    loadProducts();
    initChart();
  }
});

// LOGOUT
window.logout = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout error", err);
  }
};

// LOAD PRODUCTS
async function loadProducts() {
  const list = document.getElementById("products-list");
  if (!list) return;
  list.innerHTML = "Loading...";

  const snap = await getDocs(collection(db, "products"));
  list.innerHTML = "";
  
  document.getElementById("productsCount").innerText = snap.size;

  snap.forEach(docSnap => {
    const p = docSnap.data();
    const div = document.createElement("div");
    div.className = "product-item"; // добавьте стили в CSS
    div.style = "display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0;";
    
    div.innerHTML = `
      <span>
        <strong>${p.name}</strong> — ${p.price} AED <br>
        <small>${p.category}</small>
      </span>
      <button onclick="deleteProduct('${docSnap.id}')" style="background:none; border:none; color:red; cursor:pointer; font-size:18px;">&times;</button>
    `;
    list.appendChild(div);
  });
}

// ADD PRODUCT
window.addProduct = async () => {
  const name = document.getElementById("p-name").value.trim();
  const price = Number(document.getElementById("p-price").value);
  const category = document.getElementById("p-category").value.trim();
  const image = document.getElementById("p-image").value.trim();
  const tags = document.getElementById("p-tags").value.split(",").map(t => t.trim());

  if (!name || !price) return alert("Enter Name and Price");

  await addDoc(collection(db, "products"), { name, price, category, image, tags, createdAt: Date.now() });
  
  // Clear inputs
  ["p-name", "p-price", "p-category", "p-image", "p-tags"].forEach(id => document.getElementById(id).value = "");
  loadProducts();
};

// DELETE PRODUCT
window.deleteProduct = async (id) => {
  if(confirm("Delete this product?")) {
    await deleteDoc(doc(db, "products", id));
    loadProducts();
  }
};

// SIMPLE CHART INIT
function initChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{ label: 'Sales', data: [10, 25, 15, 40, 30], borderColor: '#e67e22', tension: 0.3 }]
        }
    });
}
