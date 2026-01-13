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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* AUTH */
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "./index.html";
  } else {
    document.getElementById("auth-status").innerText = "You are logged in.";
    loadProducts();
  }
});

/* LOGOUT */
window.logout = async () => {
  await signOut(auth);
};

/* LOAD PRODUCTS */
async function loadProducts() {
  const list = document.getElementById("products-list");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "products"));

  snap.forEach(docSnap => {
    const p = docSnap.data();

    const div = document.createElement("div");
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <strong>${p.name}</strong> — ${p.price} AED
      <button data-id="${docSnap.id}">❌</button>
    `;

    div.querySelector("button").onclick = async () => {
      await deleteDoc(doc(db, "products", docSnap.id));
      loadProducts();
    };

    list.appendChild(div);
  });
}

/* ADD PRODUCT */
window.addProduct = async () => {
  const name = document.getElementById("p-name").value;
  const price = Number(document.getElementById("p-price").value);
  const image = document.getElementById("p-image").value;
  const category = document.getElementById("p-category").value;
  const tags = document.getElementById("p-tags").value
    .split(",")
    .map(t => t.trim());

  await addDoc(collection(db, "products"), {
    name,
    price,
    image,
    category,
    tags,
    createdAt: Date.now()
  });

  loadProducts();
};