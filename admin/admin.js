/* admin.js - TAVÉINE AE FINAL LOGIC */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMAds5kqj8BUzOP2OaimC12wUqfkLs9oE",
  authDomain: "taveine-admin.firebaseapp.com",
  projectId: "taveine-admin",
  storageBucket: "taveine-admin.firebasestorage.app",
  messagingSenderId: "916085731146",
  appId: "1:916085731146:web:764187ed408e8c4fdfdbb3",
  databaseURL: "https://taveine-admin-default-rtdb.firebaseio.com"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

let dailyChart = null;

// Проверка авторизации
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("auth-status").innerText = user.email;
    loadCoreData();
  } else {
    window.location.href = "login.html";
  }
});

window.logout = () => signOut(auth);

// ОСНОВНАЯ ФУНКЦИЯ ЗАГРУЗКИ ДАННЫХ
async function loadCoreData() {
  try {
    // 1. Загрузка продуктов из Firestore
    const pSnap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
    const products = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Обновляем метрики Дашборда
    document.getElementById("dash-inv").innerText = products.length;
    const totalRev = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    document.getElementById("dash-rev").innerText = totalRev.toLocaleString() + " AED";

    // 2. Реальный счетчик КЛИЕНТОВ из Realtime Database
    // Берем уникальные chat_id из узла messages (твои реальные пользователи бота)
    const usersSnap = await get(ref(rtdb, 'messages'));
    if (usersSnap.exists()) {
      const msgs = usersSnap.val();
      const uniqueChatIds = new Set();
      Object.values(msgs).forEach(m => {
        if (m.chat_id) uniqueChatIds.add(m.chat_id);
      });
      const count = uniqueChatIds.size;
      document.getElementById("dash-users").innerText = count;
      document.getElementById("real-users-count").innerText = count;
    }

    // 3. Рендер ИНВЕНТАРЯ (Горизонтальный слайдер)
    renderInventorySlider(products);

    // 4. Рендер ГРАФИКА (Реальные данные по датам)
    renderDailyChart(products);

  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// ДОБАВЛЕНИЕ ПРОДУКТА (Только ввод)
window.addProduct = async () => {
  const name = document.getElementById("p-name").value;
  const price = document.getElementById("p-price").value;
  const category = document.getElementById("p-category").value;
  const image = document.getElementById("p-image").value;
  const tags = document.getElementById("p-tags").value;

  if (!name || !price) return alert("Please enter Name and Price!");

  const newProduct = {
    name,
    price: Number(price),
    category: category || "General",
    image: image || "https://via.placeholder.com/300",
    tags: tags || "",
    createdAt: Date.now(),
    dateString: new Date().toLocaleDateString('en-GB') // Для графика
  };

  try {
    await addDoc(collection(db, "products"), newProduct);
    alert("PRODUCT ADDED SUCCESSFULLY!");
    
    // Очистка полей
    ["p-name", "p-price", "p-category", "p-image", "p-tags"].forEach(id => {
      document.getElementById(id).value = "";
    });
    
    loadCoreData(); // Перезагрузка данных
  } catch (e) {
    alert("Error: " + e.message);
  }
};

// РЕНДЕР СЛАЙДЕРА ИНВЕНТАРЯ
function renderInventorySlider(products) {
  const list = document.getElementById("inventory-list");
  if (!list) return;
  
  if (products.length === 0) {
    list.innerHTML = "<p style='padding:20px;'>No products found.</p>";
    return;
  }

  list.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image}" class="p-img" onerror="this.src='https://via.placeholder.com/300'">
      <div class="p-body">
        <div class="p-name">${p.name}</div>
        <div class="p-price">${p.price} AED</div>
        <div style="font-size:10px; color:gray; margin-top:5px;">${p.category}</div>
      </div>
    </div>
  `).join('');
}

// РЕНДЕР ГРАФИКА ДОБАВЛЕНИЯ ТОВАРОВ
function renderDailyChart(products) {
  const ctx = document.getElementById('dailyChart');
  if (!ctx) return;

  // Группируем продукты по дате
  const dateCounts = {};
  products.forEach(p => {
    const d = p.dateString || new Date(p.createdAt).toLocaleDateString('en-GB');
    dateCounts[d] = (dateCounts[d] || 0) + 1;
  });

  const labels = Object.keys(dateCounts).reverse(); // Хронологический порядок
  const data = Object.values(dateCounts).reverse();

  if (dailyChart) dailyChart.destroy(); // Сброс старого графика

  dailyChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Items Added',
        data: data,
        backgroundColor: '#006d5b',
        borderRadius: 8
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { display: false } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// НАВИГАЦИЯ МЕЖДУ СЕКЦИЯМИ
document.querySelectorAll(".nav-link").forEach(link => {
  link.onclick = () => {
    const pageId = link.dataset.page;
    if (!pageId) return;

    // Смена активного класса в меню
    document.querySelectorAll(".nav-link").forEach(nav => nav.classList.remove("active"));
    link.classList.add("active");

    // Переключение страниц
    document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
    document.getElementById(pageId + "-page").classList.remove("hidden");

    // Обновление заголовка
    document.getElementById("page-title").innerText = pageId.toUpperCase();
  };
});
