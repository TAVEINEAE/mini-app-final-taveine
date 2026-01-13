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

// Проверка входа
onAuthStateChanged(auth, user => {
  if (!user) {
    console.log("Пользователь не авторизован");
    // Если хотите редирект на главную: window.location.href = "../index.html";
  } else {
    document.getElementById("auth-status").innerText = `Admin: ${user.email}`;
    loadProducts();
  }
});

// Глобальные функции для кнопок HTML
window.logout = async () => {
  await signOut(auth);
  location.reload();
};

window.addProduct = async () => {
  const name = document.getElementById("p-name").value.trim();
  const price = Number(document.getElementById("p-price").value);
  const category = document.getElementById("p-category").value.trim();

  if (!name || !price) return alert("Введите название и цену");

  await addDoc(collection(db, "products"), {
    name, price, category, createdAt: Date.now()
  });

  document.getElementById("p-name").value = "";
  document.getElementById("p-price").value = "";
  loadProducts();
};

window.deleteProduct = async (id) => {
  if(confirm("Удалить товар?")) {
    await deleteDoc(doc(db, "products", id));
    loadProducts();
  }
};

async function loadProducts() {
  const list = document.getElementById("products-list");
  if (!list) return;
  
  const snap = await getDocs(collection(db, "products"));
  list.innerHTML = "";
  document.getElementById("productsCount").innerText = snap.size;

  snap.forEach(docSnap => {
    const p = docSnap.data();
    const div = document.createElement("div");
    div.style = "display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee";
    div.innerHTML = `
      <span>${p.name} — ${p.price} AED</span>
      <button onclick="deleteProduct('${docSnap.id}')" style="color:red; cursor:pointer; background:none; border:none;">✕</button>
    `;
    list.appendChild(div);
  });
}
