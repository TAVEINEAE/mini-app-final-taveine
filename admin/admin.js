// Firebase Config & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Page Switching
const navLinks = document.querySelectorAll('.nav-link[data-page]');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.dataset.page + '-page';

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId)?.classList.add('active');

        document.getElementById('page-title').textContent = link.textContent.trim();

        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Load products when Inventory is opened
        if (pageId === 'inventory-page') {
            loadProducts();
        }
    });
});

// ====================
// Product Management
// ====================

let editId = null;

async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderProducts(products);
    } catch (err) {
        console.error("Error loading products:", err);
        alert("Failed to load products. Check console.");
    }
}

function renderProducts(products) {
    const container = document.getElementById('products-list');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--gray-light); padding:60px 0;">No products yet. Add your first product!</p>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image || 'https://via.placeholder.com/260x220/002f36/ffffff?text=No+Image'}" 
                 alt="${p.name}" 
                 class="product-img"
                 onerror="this.src='https://via.placeholder.com/260x220/002f36/ffffff?text=Image+Error'">
            <div class="product-info">
                <h4>${p.name}</h4>
                <div class="price">${p.price?.toLocaleString('en-AE') || '—'} AED</div>
                <div class="product-actions">
                    <button class="edit-btn" onclick="openEditModal('${p.id}', \`${p.name}\`, ${p.price || 0}, '${p.image || ''}', \`${(p.description || '').replace(/`/g,'\\`')}\`, '${p.tags?.join(',') || ''}')">
                        Edit
                    </button>
                    <button class="delete-btn" onclick="deleteProduct('${p.id}')">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

window.openAddModal = function() {
    editId = null;
    document.getElementById('modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-modal').style.display = 'flex';
};

window.openEditModal = function(id, name, price, image, description, tags) {
    editId = id;
    document.getElementById('modal-title').textContent = 'Edit Product';
    
    document.getElementById('name').value = name;
    document.getElementById('price').value = price;
    document.getElementById('image').value = image;
    document.getElementById('description').value = description;
    document.getElementById('tags').value = tags;
    
    document.getElementById('product-modal').style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('product-modal').style.display = 'none';
};

document.getElementById('product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('name').value.trim(),
        price: parseFloat(document.getElementById('price').value) || 0,
        image: document.getElementById('image').value.trim(),
        description: document.getElementById('description').value.trim(),
        tags: document.getElementById('tags').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0)
    };

    try {
        if (editId) {
            await updateDoc(doc(db, "products", editId), data);
            alert('Product updated successfully!');
        } else {
            await addDoc(collection(db, "products"), data);
            alert('Product added successfully!');
        }
        closeModal();
        loadProducts();
    } catch (err) {
        console.error("Error saving product:", err);
        alert("Failed to save product. Check console for details.");
    }
});

window.deleteProduct = async function(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        await deleteDoc(doc(db, "products", id));
        alert('Product deleted');
        loadProducts();
    } catch (err) {
        console.error("Error deleting:", err);
        alert("Failed to delete product");
    }
};

// Initial load
console.log("TAVÉINE Admin Panel ready");
