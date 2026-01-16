import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Page Switching (this is the most important fix!)
document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const pageName = this.getAttribute('data-page');
        const targetPageId = pageName + '-page';

        // Hide ALL pages first
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show the clicked page
        const targetPage = document.getElementById(targetPageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update header title
        document.getElementById('page-title').textContent = this.textContent.trim();

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        // Close sidebar on mobile
        if (window.innerWidth < 993) {
            toggleSidebar();
        }

        // Load data for specific pages
        if (pageName === 'dashboard' || pageName === 'inventory') {
            updateDashboardStats();
            if (pageName === 'dashboard') loadRecentProducts();
            if (pageName === 'inventory') loadProducts();
        }
    });
});

// Sidebar Toggle
window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
};

// Dashboard Stats & Recent Products
async function updateDashboardStats() {
    try {
        const snap = await getDocs(collection(db, "products"));
        document.getElementById('dash-products').textContent = snap.size;
    } catch (e) {
        console.error("Stats error:", e);
    }
}

async function loadRecentProducts() {
    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(5));
        const snap = await getDocs(q);
        const recent = snap.docs.map(d => d.data());
        
        document.getElementById('dashboard-recent-products').innerHTML = recent.map(p => `
            <div class="product-card">
                <img src="${p.image || 'https://via.placeholder.com/220x160'}" alt="${p.name}">
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">${p.price || 0} AED</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Recent products error:", e);
    }
}

// Inventory - Load Products
async function loadProducts() {
    try {
        const snap = await getDocs(collection(db, "products"));
        const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderProducts(products);
        updateDashboardStats();
    } catch (e) {
        alert("Failed to load products: " + e.message);
    }
}

function renderProducts(products) {
    const container = document.getElementById('products-list');
    container.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image || 'https://via.placeholder.com/300x200'}" class="product-img">
            <div class="product-info">
                <h4>${p.name}</h4>
                <div class="price">${p.price || 0} AED</div>
                <div class="product-actions">
                    <button onclick="openEditModal('${p.id}','${p.name.replace(/'/g,"\\'")}','${p.image||''}','${(p.description||'').replace(/'/g,"\\'")}','${p.tags?.join(',')||''}')">Edit</button>
                    <button onclick="deleteProduct('${p.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Modal Functions
let editId = null;

window.openAddModal = () => {
    editId = null;
    document.getElementById('modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-modal').style.display = 'flex';
};

window.openEditModal = (id, name, image, desc, tags) => {
    editId = id;
    document.getElementById('modal-title').textContent = 'Edit Product';
    document.getElementById('name').value = name;
    document.getElementById('image').value = image;
    document.getElementById('description').value = desc;
    document.getElementById('tags').value = tags;
    document.getElementById('product-modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('product-modal').style.display = 'none';
};

document.getElementById('product-form').addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
        name: document.getElementById('name').value.trim(),
        price: Number(document.getElementById('price').value),
        image: document.getElementById('image').value.trim() || null,
        description: document.getElementById('description').value.trim() || null,
        tags: document.getElementById('tags').value.split(',').map(t=>t.trim()).filter(Boolean),
        updatedAt: new Date()
    };

    if (!data.name || isNaN(data.price) || data.price <= 0) {
        alert("Name and valid price required!");
        return;
    }

    try {
        if (editId) {
            await updateDoc(doc(db, "products", editId), data);
            alert("Updated!");
        } else {
            await addDoc(collection(db, "products"), {
                ...data,
                createdAt: new Date()
            });
            alert("Added!");
        }
        closeModal();
        loadProducts();
        updateDashboardStats();
        loadRecentProducts();
    } catch (err) {
        alert("Save failed: " + err.message);
        console.error(err);
    }
});

window.deleteProduct = async id => {
    if (!confirm("Delete this product?")) return;
    try {
        await deleteDoc(doc(db, "products", id));
        loadProducts();
        updateDashboardStats();
        loadRecentProducts();
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
};

// Initial load for dashboard
updateDashboardStats();
loadRecentProducts();

console.log("Admin Panel - All fixed & working");
