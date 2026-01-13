// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// ================= CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyBMAds5kqj8BUzOP2OaimC12wUqfkLs9oE",
  authDomain: "taveine-admin.firebaseapp.com",
  projectId: "taveine-admin",
  storageBucket: "taveine-admin.firebasestorage.app",
  messagingSenderId: "916085731146",
  appId: "1:916085731146:web:764187ed408e8c4fdfdbb3"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================= AUTH =================
onAuthStateChanged(auth, user => {
  const status = document.getElementById("auth-status");

  if (!user) {
    console.log("User not logged in");
    if (status) status.innerText = "Not logged in";
    return;
  }

  console.log("Logged in:", user.email);
  if (status) status.innerText = `Admin: ${user.email}`;

  loadProducts();
});

// ================= LOGOUT =================
window.logout = async () => {
  try {
    await signOut(auth);
    console.log("Logged out");
    location.reload();
  } catch (err) {
    alert(err.message);
  }
};

// ================= ADD PRODUCT =================
window.addProduct = async () => {
  const nameEl = document.getElementById("p-name");
  const priceEl = document.getElementById("p-price");
  const categoryEl = document.getElementById("p-category");

  if (!nameEl || !priceEl) {
    alert("Inputs not found");
    return;
  }

  const name = nameEl.value.trim();
  const price = Number(priceEl.value);
  const category = categoryEl ? categoryEl.value.trim() : "";

  if (!name || !price) {
    alert("Введите название и цену");
    return;
  }

  try {
    await addDoc(collection(db, "products"), {
      name,
      price,
      category,
      createdAt: Date.now()
    });

    nameEl.value = "";
    priceEl.value = "";
    if (categoryEl) categoryEl.value = "";

    loadProducts();
  } catch (err) {
    alert(err.message);
  }
};

// ================= DELETE PRODUCT =================
window.deleteProduct = async (id) => {
  if (!id) return;

  if (!confirm("Удалить товар?")) return;

  try {
    await deleteDoc(doc(db, "products", id));
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
};

// ================= LOAD PRODUCTS =================
async function loadProducts() {
  const list = document.getElementById("products-list");
  const countEl = document.getElementById("productsCount");

  if (!list) return;

  list.innerHTML = "";

  const snap = await getDocs(collection(db, "products"));

  if (countEl) countEl.innerText = snap.size;

  snap.forEach(docSnap => {
    const p = docSnap.data();

    const div = document.createElement("div");
    div.style.cssText = `
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:10px;
      border-bottom:1px solid #2c2c2c;
    `;

    div.innerHTML = `
      <span>
        <strong>${p.name}</strong><br>
        ${p.price} AED
      </span>
      <button
        onclick="deleteProduct('${docSnap.id}')"
        style="
          background:none;
          border:none;
          color:#e74c3c;
          font-size:18px;
          cursor:pointer;
        "
      >✕</button>
    `;

    list.appendChild(div);
  });
}