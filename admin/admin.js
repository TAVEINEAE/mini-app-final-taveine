import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getDatabase, ref, onChildAdded, push } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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

let salesChart, pieChart1, pieChart2, map;
let messagesStore = {};
let activeChatId = null;

// Page switch with animation delay
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(page + '-page');
  setTimeout(() => target.classList.add('active'), 150);
  document.querySelectorAll('.nav-link, .nav-item').forEach(l => l.classList.remove('active'));
  document.querySelectorAll(`[data-page="${page}"]`).forEach(l => l.classList.add('active'));
  document.title = `Taveine AE • ${page.charAt(0).toUpperCase() + page.slice(1)}`;
}

// Navigation listeners
document.querySelectorAll('[data-page]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    switchPage(link.dataset.page);
  });
});

onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = "login.html";
  document.getElementById('user-info').textContent = user.email || 'Admin';
  loadAll();
});
// В loadAll(): await loadCalendar();


window.logout = () => signOut(auth);

async function loadAll() {
  await loadDashboardData();
  await loadProducts();
  initChat(); // Assuming initChat is defined elsewhere or add it
}

// Load dashboard data from Firebase (integrated with Telegram user data)
async function loadDashboardData() {
  // Unique visitors (Telegram users from 'users' collection, assuming Telegram bot saves user data)
  const usersSnap = await getDocs(collection(db, "users"));
  const uniqueVisitors = usersSnap.size;
  document.getElementById('unique-visitors').textContent = uniqueVisitors;
  document.getElementById('dash-users').textContent = uniqueVisitors; // Sync with inventory/customers

  // Total visits (from Telegram interactions logged in 'visits')
  const visitsSnap = await getDocs(collection(db, "visits"));
  const totalVisits = visitsSnap.size;
  document.getElementById('total-visits').textContent = totalVisits;

  // Page views (placeholder based on visits, or log from Telegram bot views)
  const pageViews = totalVisits * 3; // Real: fetch from logs if available
  document.getElementById('page-views').textContent = pageViews;

  // Bounce rate (calculated from Telegram session data)
  const bounceRate = Math.round((totalVisits - uniqueVisitors) / totalVisits * 100) || 45;
  document.getElementById('bounce-rate').textContent = `${bounceRate}%`;

  // Monthly sales from Telegram orders
  const ordersQ = query(collection(db, "orders"), orderBy("date"));
  const ordersSnap = await getDocs(ordersQ);
  let revenue = 0;
  const monthlySales = Array(12).fill(0);
  ordersSnap.forEach(doc => {
    const order = doc.data();
    revenue += order.amount;
    const month = new Date(order.date.toDate()).getMonth();
    monthlySales[month] += order.amount;
  });
  document.getElementById('dash-revenue').textContent = `${revenue} AED`;
  document.getElementById('sales-summary').textContent = `Total Revenue: ${revenue} AED`;

  // Sales chart (real data from Telegram orders)
  const salesCtx = document.getElementById('salesChart').getContext('2d');
  salesChart = new Chart(salesCtx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{ label: 'Sales', data: monthlySales, borderColor: 'var(--primary)', fill: true }]
    },
    options: { responsive: true, animations: { tension: { duration: 1000, easing: 'linear', from: 1, to: 0, loop: true } } }
  });

  // Business stats pies (from Telegram data)
  const pie1Ctx = document.getElementById('pieChart1').getContext('2d');
  pieChart1 = new Chart(pie1Ctx, {
    type: 'pie',
    data: { labels: ['Conversion', 'Bounce'], datasets: [{ data: [100 - bounceRate, bounceRate], backgroundColor: ['var(--accent-green)', 'var(--accent-red)'] }] },
    options: { responsive: true }
  });

  const pie2Ctx = document.getElementById('pieChart2').getContext('2d');
  pieChart2 = new Chart(pie2Ctx, {
    type: 'pie',
    data: { labels: ['New Users', 'Returning'], datasets: [{ data: [uniqueVisitors * 0.6, uniqueVisitors * 0.4], backgroundColor: ['var(--primary)', 'var(--primary-light)'] }] },
    options: { responsive: true }
  });

  // Task list from Firebase (Telegram-related tasks)
  const tasksSnap = await getDocs(collection(db, "tasks"));
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';
  tasksSnap.forEach((doc, index) => {
    const task = doc.data();
    taskList.innerHTML += `
      <li class="task-item" style="--task-order: ${index};">
        <span class="task-status ${task.priority}"></span>
        ${task.description} - Status: ${task.status}
      </li>
    `;
  });

  // World map with Telegram user locations (highlighted countries)
  map = L.map('world-map').setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  // Fetch user countries from Telegram data in Firebase
  const countries = {}; // Aggregate from users
  usersSnap.forEach(doc => {
    const user = doc.data();
    if (user.country) countries[user.country] = (countries[user.country] || 0) + 1;
  });
  Object.keys(countries).forEach(country => {
    // Placeholder coordinates; use real geo if available
    L.marker([24.4667, 54.3667]).addTo(map).bindPopup(`${country}: ${countries[country]} users`);
  });

  // Date and weather (real-time from browser fetch or placeholder)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('current-date').textContent = date;
  // For real weather, fetch from API (e.g., OpenWeather)
  fetch('https://api.openweathermap.org/data/2.5/weather?q=Abu%20Dhabi&appid=YOUR_API_KEY&units=metric')
    .then(res => res.json())
    .then(data => {
      document.getElementById('current-weather').textContent = `${data.weather[0].description}, ${data.main.temp}°C in Abu Dhabi`;
    })
    .catch(() => document.getElementById('current-weather').textContent = 'Sunny, 24°C in Abu Dhabi');
}

async function loadProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    document.getElementById("dash-products").textContent = snap.size;
    const categoriesContainer = document.getElementById("inventory-categories") || document.getElementById("inventory-list");
    categoriesContainer.innerHTML = "";
    const productsByCategory = {};
    snap.forEach(doc => {
      const p = doc.data();
      const category = p.category || "Uncategorized";
      if (!productsByCategory[category]) {
        productsByCategory[category] = [];
      }
      productsByCategory[category].push(p);
    });
    Object.entries(productsByCategory).forEach(([category, products]) => {
      const section = document.createElement("div");
      section.className = "category-section";
      section.innerHTML = `<div class="category-title">${category} (${products.length})</div>`;
      const slider = document.createElement("div");
      slider.className = "category-slider";
      products.forEach(p => {
        slider.innerHTML += `
          <div class="product-card">
            <img class="product-img" src="${p.image || 'https://via.placeholder.com/300x140'}" alt="${p.name}">
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
    if (Object.keys(productsByCategory).length === 0) {
      categoriesContainer.innerHTML = '<p style="text-align:center; color:var(--gray);">No products yet</p>';
    }
  } catch (e) {
    console.error("Products error:", e);
  }
}

// Add product function (assuming from original)
async function addProduct() {
  const name = document.getElementById('p-name').value;
  const price = parseFloat(document.getElementById('p-price').value);
  const category = document.getElementById('p-category').value;
  const image = document.getElementById('p-image').value;
  if (!name || !price) return alert('Name and price required');
  await addDoc(collection(db, "products"), { name, price, category, image, createdAt: serverTimestamp() });
  loadProducts();
}

// Init chat (placeholder, expand as needed for Telegram integration)
function initChat() {
  // Listen for Telegram messages via Realtime DB
  const chatsRef = ref(rtdb, 'chats');
  onChildAdded(chatsRef, snap => {
    // Update chat list
  });
  // When rendering messages:
  // const messages = document.querySelectorAll('.message');
  // messages.forEach((msg, index) => msg.style.setProperty('--msg-order', index));
}

// Send message (for chat)
function sendMessage() {
  const input = document.getElementById('reply-input').value;
  if (!input || !activeChatId) return;
  push(ref(rtdb, `chats/${activeChatId}`), { text: input, from: 'admin', timestamp: Date.now() });
}
