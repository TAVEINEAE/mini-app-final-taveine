// =============================================
// TAVÉINE ADMIN PANEL - JavaScript (with Firebase)
// Updated: Real Orders & Revenue on Dashboard + Notification + Auth + Telegram Integration Support
// =============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBMAds5kqj8BUzOP2OaimC12wUqfkLs9oE",
    authDomain: "taveine-admin.firebaseapp.com",
    projectId: "taveine-admin",
    storageBucket: "taveine-admin.firebasestorage.app",
    messagingSenderId: "916085731146",
    appId: "1:916085731146:web:764187ed408e8c4fdfdbb3"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// =============================================
// Authentication Logic
// =============================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User logged in - show admin panel
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('sidebar').style.display = 'block';
        document.getElementById('header').style.display = 'flex';
        // Load default page
        document.querySelector('.nav-link.active').click();
    } else {
        // Not logged in - show login
        document.querySelectorAll('.page:not(#login-page)').forEach(p => p.classList.remove('active'));
        document.getElementById('login-page').classList.add('active');
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('header').style.display = 'none';
    }
});

// Login Form
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
   } catch (error) {
    console.error("LOGIN FULL ERROR:", error.code, error.message);  // ← это покажет в консоли браузера
    
    let displayMsg = "Invalid email or password";
    if (error.code === 'auth/invalid-credential') {
        displayMsg = "Неверные данные (возможно защита Firebase включена или пользователь не существует)";
    } else if (error.code === 'auth/user-not-found') {
        displayMsg = "Пользователь с таким email не найден";
    } else if (error.code === 'auth/wrong-password') {
        displayMsg = "Неверный пароль";
    } else if (error.code === 'auth/operation-not-allowed') {
        displayMsg = "Метод Email/Password не включён в консоли";
    }
    
    document.getElementById('login-error').textContent = displayMsg;
    document.getElementById('login-error').style.display = 'block';
}

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut(auth);
});

// =============================================
// Page Switching Logic
// =============================================
const navLinks = document.querySelectorAll('.nav-link[data-page]');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
      
        const pageId = link.dataset.page + '-page';
      
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        // Show selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');
      
        // Update header title
        document.getElementById('page-title').textContent = link.textContent.trim();
      
        // Update active nav link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        // Load data when needed
        if (pageId === 'inventory-page') {
            loadProducts();
        }
        if (pageId === 'dashboard-page') {
            loadDashboardStats();
            startNotificationPolling();
        }
        if (pageId === 'orders-page') {
            loadOrders();
            startNotificationPolling();
        } else {
            stopNotificationPolling();
        }
    });
});

// =============================================
// Helper: Escape HTML to prevent XSS
// =============================================
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =============================================
// Dashboard Stats — реальные данные из Firebase
// =============================================
async function loadDashboardStats() {
    try {
        // 1. Продукты
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsCount = productsSnapshot.size;
        document.getElementById('dash-products').textContent = productsCount;
        // 2. Заказы + Revenue (реальные из Firebase)
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const orders = ordersSnapshot.docs.map(doc => doc.data());
        const ordersCount = orders.length;
        const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        document.getElementById('dash-orders').textContent = ordersCount;
        document.getElementById('dash-revenue').textContent = revenue.toLocaleString('ar-AE') + ' AED';
        console.log(`Dashboard: ${productsCount} продуктов, ${ordersCount} заказов, ${revenue} AED`);
    } catch (e) {
        console.error("Ошибка загрузки статистики:", e);
        document.getElementById('dash-products').textContent = '—';
        document.getElementById('dash-orders').textContent = '—';
        document.getElementById('dash-revenue').textContent = 'Ошибка';
    }
}

// =============================================
// Product Management Functions
// =============================================
let currentEditId = null;
async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Разделяем по категориям
        renderCategoryProducts(products, 'new-arrivals-list', 'new');
        renderCategoryProducts(products, 'birthday-list', 'birthday');
        renderCategoryProducts(products, 'bestsellers-list', 'bestseller');
        renderCategoryProducts(products, 'luxury-list', 'luxury');
        // Остальные продукты
        const other = products.filter(p =>
            !p.tags?.includes('new') &&
            !p.tags?.includes('birthday') &&
            !p.tags?.includes('bestseller') &&
            !p.tags?.includes('luxury')
        );
        renderCategoryProducts(other, 'other-products-list', null);
    } catch (error) {
        console.error("Failed to load products:", error);
        alert("Could not load products.\n\nError: " + error.message);
    }
}
function renderCategoryProducts(products, containerId, tag) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let filtered = products;
    if (tag) {
        filtered = products.filter(p => p.tags?.includes(tag));
    }
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--gray-light); padding:40px 0;">No products in this category yet</p>';
        return;
    }
    container.innerHTML = filtered.map(product => `
        <div class="product-card">
            <img src="${escapeHtml(product.image || 'https://via.placeholder.com/260x220/002f36/ffffff?text=No+Image')}"
                 alt="${escapeHtml(product.name)}"
                 class="product-img"
                 onerror="this.src='https://via.placeholder.com/260x220/002f36/ffffff?text=Image+Error'">
            <div class="product-info">
                <h4>${escapeHtml(product.name)}</h4>
                <div class="price">${(product.price || 0).toLocaleString('ar-AE')} AED</div>
                <div class="product-actions">
                    <button class="edit-btn"
                            onclick="openEditModal('${product.id}',
                                                  \`${escapeHtml(product.name)}\`,
                                                  ${product.price || 0},
                                                  '${escapeHtml(product.image || '')}',
                                                  \`${escapeHtml(product.description || '')}\`,
                                                  '${product.tags?.join(',') || ''}')">
                        Edit
                    </button>
                    <button class="delete-btn"
                            onclick="deleteProduct('${product.id}')">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}
// Open modal for adding new product
window.openAddModal = function() {
    currentEditId = null;
    document.getElementById('modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-modal').style.display = 'flex';
};
// Open modal for editing existing product
window.openEditModal = function(id, name, price, image, description, tags) {
    currentEditId = id;
    document.getElementById('modal-title').textContent = 'Edit Product';
  
    document.getElementById('name').value = name;
    document.getElementById('price').value = price;
    document.getElementById('image').value = image;
    document.getElementById('description').value = description;
    document.getElementById('tags').value = tags;
  
    document.getElementById('product-modal').style.display = 'flex';
};
// Close modal
window.closeModal = function() {
    document.getElementById('product-modal').style.display = 'none';
};
// Form submission - Add or Update
document.getElementById('product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-product-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    // Get form values
    const name = document.getElementById('name').value.trim();
    const priceInput = document.getElementById('price').value.trim();
    const image = document.getElementById('image').value.trim();
    const description = document.getElementById('description').value.trim();
    const tagsInput = document.getElementById('tags').value.trim();
    // Basic validation
    if (!name) {
        alert("Please enter product name");
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Product';
        return;
    }
  
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
        alert("Please enter a valid positive price");
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Product';
        return;
    }
    const data = {
        name: name,
        price: price,
        image: image || null,
        description: description || null,
        tags: tagsInput
            ? tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
            : [],
        updatedAt: new Date()
    };
    try {
        if (currentEditId) {
            // Update existing product
            await updateDoc(doc(db, "products", currentEditId), data);
            alert('Product updated successfully!');
        } else {
            // Add new product
            await addDoc(collection(db, "products"), {
                ...data,
                createdAt: new Date()
            });
            alert('Product added successfully!');
        }
        closeModal();
        loadProducts();
    } catch (error) {
        console.error("Detailed Firebase error:", error);
        alert("Failed to save product.\n\nError details: " + error.message +
              "\n\n(Code: " + (error.code || 'unknown') + ")");
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Product';
    }
});
// Delete product
window.deleteProduct = async function(id) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }
    try {
        await deleteDoc(doc(db, "products", id));
        alert('Product deleted successfully');
        loadProducts();
    } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete product.\n\nError: " + error.message);
    }
};
// =============================================
// Orders from Telegram (Firebase)
// =============================================
async function loadOrders() {
    const container = document.getElementById('orders-list');
    container.innerHTML = '<p>Загрузка заказов...</p>';
    try {
        const snapshot = await getDocs(collection(db, "orders"));
        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        if (orders.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--gray-light); padding:60px 0;">Пока нет заказов</p>';
            return;
        }
        container.innerHTML = orders.map(order => `
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(212,175,55,0.15); border-radius:12px; padding:20px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <strong style="color:var(--gold);">Заказ ${escapeHtml(order.id)}</strong>
                    <span style="color:var(--gray-light);">${new Date(order.createdAt?.toDate?.() ?? new Date(order.createdAt)).toLocaleString('ru-RU')}</span>
                </div>
                <p><strong>Клиент:</strong> ${escapeHtml(order.customer.name)} (${escapeHtml(order.customer.phone)})</p>
                <p><strong>Email:</strong> ${escapeHtml(order.customer.email)}</p>
                <p><strong>Адрес:</strong> ${escapeHtml(order.customer.address)}</p>
                <p><strong>Сумма:</strong> ${order.total} AED</p>
                <p><strong>Комментарий:</strong> ${escapeHtml(order.customer.comment || '—')}</p>
                <div style="margin-top:12px;">
                    <strong>Товары:</strong>
                    <ul style="margin-top:8px; padding-left:20px;">
                        ${order.items.map(item => `
                            <li>${escapeHtml(item.name)} × ${item.qty} — ${item.subtotal} AED</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Ошибка загрузки заказов:", e);
        container.innerHTML = '<p style="color:#ef5350; text-align:center;">Ошибка загрузки заказов</p>';
    }
}
// =============================================
// Уведомление о новом заказе (улучшенное)
// =============================================
let notificationInterval = null;
let lastKnownTimestamp = localStorage.getItem('lastOrderTimestamp') ? parseInt(localStorage.getItem('lastOrderTimestamp')) : 0;

async function checkNewOrders() {
    try {
        const snapshot = await getDocs(collection(db, "orders"));
        let newestTs = 0;
        let newCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const ts = data.createdAt?.toMillis?.() ?? new Date(data.createdAt).getTime() ?? 0;
            if (ts > lastKnownTimestamp) {
                newCount++;
            }
            if (ts > newestTs) newestTs = ts;
        });

        if (newCount > 0) {
            // Новые заказы!
            const notification = document.createElement('div');
            notification.innerHTML = `
                <div style="position:fixed; top:20px; right:20px; background:var(--gold); color:#001f24; padding:16px 24px; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.5); z-index:9999; font-weight:700; animation: fadeIn 0.5s;">
                    Новый заказ! (${newCount}) Всего: ${snapshot.size}
                </div>
            `;
            document.body.appendChild(notification.firstElementChild);
           
            // Звук уведомления
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-2-113.mp3');
            audio.play().catch(() => console.log("Звук заблокирован"));
            // Убираем через 5 секунд
            setTimeout(() => notification.firstElementChild?.remove(), 5000);
           
            localStorage.setItem('lastOrderTimestamp', newestTs.toString());
            lastKnownTimestamp = newestTs;
        }
    } catch (e) {
        console.error("Ошибка проверки заказов:", e);
    }
}

function startNotificationPolling() {
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(checkNewOrders, 10000);
    checkNewOrders(); // Immediate check
}

function stopNotificationPolling() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
}

// Initial load (but only after auth)
loadDashboardStats();
// Initial console message
console.log("TAVÉINE Admin Panel - Updated with Auth & Improved Notifications");
