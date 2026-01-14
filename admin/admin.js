// admin.js — финальная версия (15 января 2026)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getDatabase, ref, onChildAdded, push } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMAds5kqj8BUzOP2OaimC12wUqfkLs9oE",
  authDomain: "taveine-admin.firebaseapp.com",
  projectId: "taveine-admin",
  storageBucket: "taveine-admin.firebasestorage.app",
  messagingSenderId: "916085731146",
  appId: "1:916085731146:web:764187ed408e8c4fdfdbb3",
  databaseURL: "https://taveine-admin-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

const GAS_URL = "https://script.google.com/macros/s/AKfycbz7z0ZRjek0gTPWf4FG55mWSh1uBEpgrsgx0B6WUw6xvbjs9T04dWnTVZI-vaJA6BctDw/exec";

// ================================================
// State
// ================================================
let productsChart = null;
const messagesStore = {};
let activeChatId = null;

// ================================================
// Навигация между экранами
// ================================================
function goToScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${screenId}`).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-screen="${screenId}"]`);
  if (navItem) navItem.classList.add('active');
}

// ================================================
// Auth & Init
// ================================================
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Можно добавить имя админа, если нужно
  // document.querySelector('.greeting').textContent = `Hello, ${user.displayName || 'Admin'}!`;

  loadAllData();
  goToScreen('dashboard'); // стартовая страница
});

// Клик по пунктам меню
document.querySelectorAll('.nav-item[data-screen]').forEach(item => {
  item.addEventListener('click', () => {
    goToScreen(item.dataset.screen);
  });
});

window.logout = () => signOut(auth).then(() => location.href = "login.html");

// ================================================
// Продукты
// ================================================
window.addProduct = async () => {
  const name     = document.getElementById("p-name")?.value?.trim();
  const priceStr = document.getElementById("p-price")?.value?.trim();
  const category = document.getElementById("p-category")?.value?.trim();
  const image    = document.getElementById("p-image")?.value?.trim();
  const tagsStr  = document.getElementById("p-tags")?.value?.trim();

  if (!name || !priceStr) {
    alert("Название и цена — обязательные поля!");
    return;
  }

  const price = Number(priceStr);
  if (isNaN(price) || price <= 0) {
    alert("Введите корректную цену!");
    return;
  }

  try {
    await addDoc(collection(db, "products"), {
      name,
      price,
      category: category || null,
      image: image || null,
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : null,
      createdAt: serverTimestamp()
    });

    alert("Товар успешно добавлен!");
    clearProductForm();
    loadProducts();
    goToScreen('inventory'); // после добавления сразу переходим в инвентарь — удобно
  } catch (err) {
    console.error("Ошибка добавления:", err);
    alert("Не удалось добавить товар: " + err.message);
  }
};

function clearProductForm() {
  ["p-name", "p-price", "p-category", "p-image", "p-tags"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

async function loadProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    document.getElementById("dash-products").textContent = snap.size;

    const container = document.getElementById("inventory-list");
    if (!container) return;

    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = '<div style="padding:60px; text-align:center; color:#64748b; width:100%;">Пока нет товаров...</div>';
      return;
    }

    const productsByDay = {};

    snap.forEach(doc => {
      const p = doc.data();
      const date = p.createdAt?.toDate?.() || new Date(p.createdAt || Date.now());
      const dayKey = date.toISOString().split('T')[0];
      productsByDay[dayKey] = (productsByDay[dayKey] || 0) + 1;

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img class="product-img" 
             src="${p.image || 'https://via.placeholder.com/400x260?text=No+Image'}" 
             onerror="this.src='https://via.placeholder.com/400x260?text=Ошибка+изображения'"
             alt="${p.name}">
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price">${p.price.toLocaleString('ru-RU')} AED</div>
        </div>
      `;
      container.appendChild(card);
    });

    updateProductsChart(productsByDay);
  } catch (err) {
    console.error("Ошибка загрузки продуктов:", err);
  }
}

function updateProductsChart(byDay) {
  const sortedDays = Object.keys(byDay).sort();
  const labels = sortedDays.map(d => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
  const data = sortedDays.map(d => byDay[d]);

  if (productsChart) productsChart.destroy();

  productsChart = new Chart(document.getElementById('productsChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Добавлено товаров',
        data,
        backgroundColor: 'rgba(0, 109, 91, 0.7)',
        borderColor: 'rgba(0, 109, 91, 0.9)',
        borderWidth: 1,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

// ================================================
// Чат (WhatsApp-style)
// ================================================
function initChat() {
  onChildAdded(ref(rtdb, 'messages'), snap => {
    const msg = snap.val();
    if (!msg?.chat_id) return;

    if (!messagesStore[msg.chat_id]) {
      messagesStore[msg.chat_id] = {
        name: msg.name || "Unknown User",
        username: msg.username || null,
        msgs: []
      };
    }

    messagesStore[msg.chat_id].msgs.push(msg);

    if (activeChatId === msg.chat_id) {
      renderMessages();
    } else {
      // Просто обновляем список, если новый чат
      updateChatList();
    }

    updateCustomerCount();
  });
}

function updateChatList() {
  const container = document.getElementById("chat-list");
  if (!container) return;

  container.innerHTML = "";

  Object.entries(messagesStore)
    .sort(([,a], [,b]) => (b.msgs.at(-1)?.timestamp || 0) - (a.msgs.at(-1)?.timestamp || 0))
    .forEach(([id, chat]) => {
      const lastMsg = chat.msgs.at(-1);
      const item = document.createElement("div");
      item.className = "chat-item";
      if (id === activeChatId) item.classList.add("active");

      item.innerHTML = `
        <div class="chat-avatar-placeholder"></div>
        <div class="chat-preview">
          <strong>${chat.name}</strong>
          ${chat.username ? `<small>@${chat.username}</small>` : ''}
          ${lastMsg ? `
            <div class="last-message-preview">
              ${lastMsg.sender === 'admin' ? 'Вы: ' : ''}${lastMsg.text.substring(0, 45)}${lastMsg.text.length > 45 ? '...' : ''}
            </div>
          ` : ''}
        </div>
      `;

      item.onclick = () => selectChat(id);
      container.appendChild(item);
    });
}

window.selectChat = (id) => {
  activeChatId = id;
  document.getElementById("active-chat-header").textContent = 
    messagesStore[id]?.name || "Чат #" + id;

  updateChatList(); // обновляем подсветку
  renderMessages();
};

function renderMessages() {
  const container = document.getElementById("chat-box");
  if (!container || !activeChatId || !messagesStore[activeChatId]) return;

  container.innerHTML = "";

  messagesStore[activeChatId].msgs.forEach(m => {
    const div = document.createElement("div");
    div.className = `message ${m.sender === 'admin' ? 'admin' : 'user'}`;
    div.textContent = m.text;

    // Можно добавить время
    const time = document.createElement("small");
    time.textContent = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    time.style.display = "block";
    time.style.fontSize = "0.75rem";
    time.style.opacity = "0.7";
    time.style.marginTop = "4px";
    div.appendChild(time);

    container.appendChild(div);
  });

  container.scrollTop = container.scrollHeight;
}

window.sendMessage = async () => {
  const input = document.getElementById("reply-input");
  if (!input) return;

  const text = input.value.trim();
  if (!text || !activeChatId) return;

  const msg = {
    chat_id: activeChatId,
    text,
    sender: 'admin',
    timestamp: Date.now(),
    name: "Admin"
  };

  try {
    // Отправка через Google Apps Script (уведомление пользователю)
    fetch(`${GAS_URL}?chatId=${activeChatId}&text=${encodeURIComponent(text)}`, { mode: 'no-cors' });

    // Сохраняем в базу
    await push(ref(rtdb, 'messages'), msg);

    input.value = "";
    // renderMessages() придёт через onChildAdded автоматически
  } catch (err) {
    console.error("Ошибка отправки:", err);
  }
};

function updateCustomerCount() {
  const count = Object.keys(messagesStore).length;
  document.getElementById("dash-users").textContent = count;
  document.getElementById("real-users-count").textContent = count;
}

// ================================================
// Инициализация всего при загрузке
// ================================================
async function loadAllData() {
  await Promise.all([
    loadProducts(),
  ]);

  initChat();
  updateCustomerCount();
}