// =============================================
// TAVÉINE ADMIN PANEL - JavaScript (with Firebase)
// Updated: Orders from localStorage + Categories in Inventory
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
        }
        if (pageId === 'orders-page') {
            loadOrders();
        }
    });
});

// =============================================
// Dashboard Stats
// =============================================
async function loadDashboardStats() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        const productsCount = snapshot.size;
        document.getElementById('dash-products').textContent = productsCount;

        // Orders count from localStorage (from Telegram)
        const orders = JSON.parse(localStorage.getItem('taveine_orders') || '[]');
        document.getElementById('dash-orders').textContent = orders.length;

        // Revenue (simple sum)
        const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        document.getElementById('dash-revenue').textContent = revenue.toLocaleString('en-AE') + ' AED';
    } catch (e) {
        console.error("Dashboard stats error:", e);
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

        // Остальные продукты (без этих тегов)
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
            <img src="${product.image || 'https://via.placeholder.com/260x220/002f36/ffffff?text=No+Image'}"
                 alt="${product.name}"
                 class="product-img"
                 onerror="this.src='https://via.placeholder.com/260x220/002f36/ffffff?text=Image+Error'">
            <div class="product-info">
                <h4>${product.name}</h4>
                <div class="price">${(product.price || 0).toLocaleString('en-AE')} AED</div>
                <div class="product-actions">
                    <button class="edit-btn"
                            onclick="openEditModal('${product.id}',
                                                  \`${product.name.replace(/`/g, '\\`')}\`,
                                                  ${product.price || 0},
                                                  '${product.image || ''}',
                                                  \`${(product.description || '').replace(/`/g, '\\`')}\`,
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
    // Get form values
    const name = document.getElementById('name').value.trim();
    const priceInput = document.getElementById('price').value.trim();
    const image = document.getElementById('image').value.trim();
    const description = document.getElementById('description').value.trim();
    const tagsInput = document.getElementById('tags').value.trim();

    // Basic validation
    if (!name) {
        alert("Please enter product name");
        return;
    }
   
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
        alert("Please enter a valid positive price");
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
// Orders from Telegram (localStorage)
// =============================================
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('taveine_orders') || '[]');
    const container = document.getElementById('orders-list');

    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--gray-light); padding:60px 0;">No orders from Telegram yet</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(212,175,55,0.15); border-radius:12px; padding:20px; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <strong style="color:var(--gold);">Order ${order.id}</strong>
                <span style="color:var(--gray-light);">${order.created}</span>
            </div>
            <p><strong>Customer:</strong> ${order.customer.name} (${order.customer.phone})</p>
            <p><strong>Address:</strong> ${order.customer.address}</p>
            <p><strong>Total:</strong> ${order.total} AED</p>
            <p><strong>Comment:</strong> ${order.customer.comment || '—'}</p>
            <div style="margin-top:12px;">
                <strong>Items:</strong>
                <ul style="margin-top:8px; padding-left:20px;">
                    ${order.items.map(item => `<li>${item.name} × ${item.qty} — ${item.subtotal} AED</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');
}

// Initial load for dashboard
loadDashboardStats();

// Initial console message
console.log("TAVÉINE Admin Panel - Updated with Orders & Categories");
