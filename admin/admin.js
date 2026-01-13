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

/* ================= AUTH CHECK ================= */
onAuthStateChanged(auth, (user) => {
  const statusText = document.getElementById("auth-status");
  if (user) {
    if (statusText) statusText.innerText = `Admin: ${user.email}`;
    loadProducts(); // Загружаем данные только если вошли
  } else {
    // Если не залогинен — отправляем на логин
    window.location.href = "./login.html";
  }
});

/* ================= ACTIONS ================= */
window.logout = async () => {
  await signOut(auth);
  window.location.href = "./login.html";
};

window.addProduct = async () => {
  const name = document.getElementById("p-name").value.trim();
  const price = Number(document.getElementById("p-price").value);
  const category = document.getElementById("p-category").value.trim();
  const image = document.getElementById("p-image").value.trim();
  const tags = document.getElementById("p-tags").value
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  if (!name || !price || !category) {
    alert("Fill name, price and category");
    return;
  }

  try {
    await addDoc(collection(db, "products"), {
      name, price, category, image, tags, createdAt: Date.now()
    });
    // Очистка полей
    ["p-name", "p-price", "p-category", "p-image", "p-tags"].forEach(id => document.getElementById(id).value = "");
    loadProducts();
  } catch (e) {
    console.error("Error adding product:", e);
  }
};

/* ================= LOAD PRODUCTS ================= */
async function loadProducts() {
  const list = document.getElementById("products-list");
  const count = document.getElementById("productsCount");
  if (!list) return;

  list.innerHTML = "Loading...";

  try {
    const snap = await getDocs(collection(db, "products"));
    if (count) count.innerText = snap.size;
    list.innerHTML = "";

    snap.forEach(docSnap => {
      const p = docSnap.data();
      const div = document.createElement("div");
      div.className = "product-item"; // Стили лучше вынести в CSS
      div.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; margin-bottom:8px; background:#111; border-radius:8px; color: #fff;";

      div.innerHTML = `
        <span>${p.name} — ${p.price} AED</span>
        <button style="background:#c0392b;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer">✕</button>
      `;

      div.querySelector("button").onclick = async () => {
        if(confirm("Delete this product?")) {
          await deleteDoc(doc(db, "products", docSnap.id));
          loadProducts();
        }
      };
      list.appendChild(div);
    });
  } catch (e) {
    console.error("Error loading products:", e);
  }
}

// ================= NAVIGATION =================
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".nav-link");
  const pages = document.querySelectorAll(".page");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      const targetPage = link.getAttribute("data-page");
      pages.forEach(p => p.classList.add("hidden"));
      
      const targetEl = document.getElementById(`${targetPage}-page`);
      if (targetEl) targetEl.classList.remove("hidden");
    });
  });
});
