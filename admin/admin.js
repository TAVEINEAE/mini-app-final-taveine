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

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyBMAds5kqj8BUzOP2OaimC12wUqfkLs9oE",
  authDomain: "taveine-admin.firebaseapp.com",
  projectId: "taveine-admin",
  storageBucket: "taveine-admin.firebasestorage.app",
  messagingSenderId: "916085731146",
  appId: "1:916085731146:web:764187ed408e8c4fdfdbb3"
};

/* INIT */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= AUTH ================= */
onAuthStateChanged(auth, user => {
  if (!user) {
    // если не залогинен — назад на login
    window.location.href = "./index.html";
  } else {
    const status = document.getElementById("auth-status");
    if (status) status.innerText = "You are logged in.";
    loadProducts();
  }
});

/* ================= LOGOUT ================= */
window.logout = async () => {
  await signOut(auth);
};

/* ================= LOAD PRODUCTS ================= */
async function loadProducts() {
  const list = document.getElementById("products-list");
  if (!list) return;

  list.innerHTML = "";

  const snap = await getDocs(collection(db, "products"));

  snap.forEach(docSnap => {
    const p = docSnap.data();

    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.alignItems = "center";
    div.style.marginBottom = "10px";
    div.style.padding = "10px";
    div.style.border = "1px solid #eee";
    div.style.borderRadius = "8px";

    div.innerHTML = `
      <span>
        <strong>${p.name}</strong><br>
        ${p.price} AED<br>
        <small>${p.category}</small>
      </span>
      <button style="background:#c0392b;border:none;color:#fff;padding:8px 10px;border-radius:6px;cursor:pointer">
        ❌
      </button>
    `;

    div.querySelector("button").onclick = async () => {
      await deleteDoc(doc(db, "products", docSnap.id));
      loadProducts();
    };

    list.appendChild(div);
  });
}

/* ================= ADD PRODUCT ================= */
window.addProduct = async () => {
  const name = document.getElementById("p-name").value.trim();
  const price = Number(document.getElementById("p-price").value);
  const image = document.getElementById("p-image").value.trim();
  const category = document.getElementById("p-category").value.trim();
  const tags = document.getElementById("p-tags").value
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  if (!name || !price || !category) {
    alert("Fill name, price and category");
    return;
  }

  await addDoc(collection(db, "products"), {
    name,
    price,
    image,
    category,
    tags,
    createdAt: Date.now()
  });

  // очистка формы
  document.getElementById("p-name").value = "";
  document.getElementById("p-price").value = "";
  document.getElementById("p-image").value = "";
  document.getElementById("p-category").value = "";
  document.getElementById("p-tags").value = "";

  loadProducts();
};