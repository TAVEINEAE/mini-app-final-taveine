import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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

let activeChatId = null;

// Navigation
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page + '-page')?.classList.add('active');
  
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.nav-link[data-page="${page}"]`)?.classList.add('active');
  
  document.getElementById('page-title').textContent = page.charAt(0).toUpperCase() + page.slice(1);
}

document.querySelectorAll('.nav-link[data-page]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    switchPage(link.dataset.page);
  });
});

onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = "login.html";
  loadAll();
});

window.logout = () => signOut(auth);

async function loadAll() {
  await loadProducts();
  loadCalendar();
  loadMap();
  initChat();
}

// 1. Products + Recent on Dashboard + Inventory
async function loadProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  
  document.getElementById("dash-products").textContent = snap.size;

  // Recent products on Dashboard
  const recentContainer = document.getElementById("dashboard-recent-products");
  if (recentContainer) {
    recentContainer.innerHTML = "";
    const products = [];
    snap.forEach(doc => products.push(doc.data()));
    products.slice(0, 8).forEach(p => {
      recentContainer.innerHTML += `
        <div class="product-card">
          <img class="product-img" src="${p.image || 'https://via.placeholder.com/220x160'}" alt="${p.name}">
          <div class="product-info">
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price || '—'} AED</div>
          </div>
        </div>
      `;
    });
  }

  // Full inventory with categories
  const categoriesContainer = document.getElementById("inventory-categories");
  if (categoriesContainer) {
    categoriesContainer.innerHTML = "";
    const productsByCategory = {};
    snap.forEach(doc => {
      const p = doc.data();
      const cat = p.category || "Uncategorized";
      if (!productsByCategory[cat]) productsByCategory[cat] = [];
      productsByCategory[cat].push(p);
    });

    Object.entries(productsByCategory).forEach(([cat, prods]) => {
      const section = document.createElement("div");
      section.className = "category-section";
      section.innerHTML = `<h3 class="category-title">${cat} (${prods.length})</h3>`;
      const slider = document.createElement("div");
      slider.className = "category-slider";
      prods.forEach(p => {
        slider.innerHTML += `
          <div class="product-card">
            <img class="product-img" src="${p.image || 'https://via.placeholder.com/220x160'}" alt="${p.name}">
            <div class="product-info">
              <div class="product-name">${p.name}</div>
              <div class="product-price">${p.price || '—'} AED</div>
            </div>
          </div>
        `;
      });
      section.appendChild(slider);
      categoriesContainer.appendChild(section);
    });
  }
}

// 2. Calendar with products
function loadCalendar() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: async function(fetchInfo, successCallback) {
      const snap = await getDocs(collection(db, "products"));
      const events = [];
      const counts = {};

      snap.forEach(doc => {
        const date = doc.data().createdAt?.toDate()?.toISOString().split('T')[0];
        if (date) counts[date] = (counts[date] || 0) + 1;
      });

      Object.entries(counts).forEach(([date, count]) => {
        events.push({ title: `${count} products`, start: date });
      });
      successCallback(events);
    },
    eventClick: async function(info) {
      const date = info.event.startStr;
      const snap = await getDocs(collection(db, "products"));
      let list = 'Products added on ' + date + ':\n\n';
      snap.forEach(doc => {
        const p = doc.data();
        if (p.createdAt?.toDate()?.toISOString().split('T')[0] === date) {
          list += `• ${p.name} - ${p.price || '?'} AED\n`;
        }
      });
      alert(list || 'No products on this day');
    }
  });
  calendar.render();
}

// 3. Map with current location
function loadMap() {
  const mapEl = document.getElementById('location-map');
  if (!mapEl) return;

  const map = L.map(mapEl).setView([34.05, -118.24], 10); // default LA
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 15);
      L.marker([latitude, longitude]).addTo(map)
        .bindPopup('Your current location')
        .openPopup();
    }, () => {
      alert('Could not get your location');
    });
  }
}

// 4. Chat (Telegram style + DB)
function initChat() {
  const chatListEl = document.getElementById('chat-list');
  if (!chatListEl) return;

  // Example: listen for chats from realtime db
  onValue(ref(rtdb, 'chats'), (snapshot) => {
    chatListEl.innerHTML = '';
    snapshot.forEach(child => {
      const chatId = child.key;
      chatListEl.innerHTML += `<div class="chat-item" onclick="loadChat('${chatId}')">${chatId}</div>`;
    });
  });
}

window.loadChat = function(chatId) {
  activeChatId = chatId;
  document.getElementById('chat-header').textContent = chatId;
  
  onValue(ref(rtdb, `chats/${chatId}`), (snapshot) => {
    const msgs = document.getElementById('chat-messages');
    msgs.innerHTML = '';
    snapshot.forEach(child => {
      const msg = child.val();
      msgs.innerHTML += `<div class="message ${msg.from === 'admin' ? 'admin' : 'user'}">${msg.text}</div>`;
    });
    msgs.scrollTop = msgs.scrollHeight;
  });
}

window.sendMessage = function() {
  const input = document.getElementById('reply-input');
  if (!input.value || !activeChatId) return;

  push(ref(rtdb, `chats/${activeChatId}`), {
    text: input.value,
    from: 'admin',
    timestamp: Date.now()
  });

  input.value = '';
}
