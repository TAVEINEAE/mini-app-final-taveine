// Firebase Config & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    doc, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

        // Close sidebar on mobile after selection
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }

        // Load products when Inventory is opened
        if (pageId === 'inventory-page') {
            loadProducts();
        }
    });
});

// Sidebar toggle (mobile)
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Product Management
let currentEditId = null;

async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts(products);
    } catch (error) {
        console.error("Load error:", error);
        alert("Failed to load products: " + error.message);
    }
}

function renderProducts(products) {
    const container = document.getElementById('products-list');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:60px 0; color:var(--gray-light);">No products yet...</p>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image || 'https://via.placeholder.com/300x200/002f36/ffffff?text=No+Image'}" 
                 class="product-img" alt="${p.name}">
            <div class="product-info">
                <h4>${p.name}</h4>
                <div class="price">${(p.price || 0).toLocaleString('en-AE')} AED</div>
                <div class="product-actions">
                    <button onclick="openEditModal('${p.id}', \`${p.name.replace(/`/g,'\\`')}\`, ${p.price||0}, '${p.image||''}', \`${(p.description||'').replace(/`/g,'\\`')}\`, '${p.tags?.join(',')||''}')">
                        Edit
                    </button>
                    <button onclick="deleteProduct('${p.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

window.openAddModal = () => {
    currentEditId = null;
    document.getElementById('modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-modal').style.display = 'flex';
};

window.openEditModal = (id, name, price, image, desc, tags) => {
    currentEditId = id;
    document.getElementById('modal-title').textContent = 'Edit Product';
    document.getElementById('name').value = name;
    document.getElementById('price').value = price;
    document.getElementById('image').value = image;
    document.getElementById('description').value = desc;
    document.getElementById('tags').value = tags;
    document.getElementById('product-modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('product-modal').style.display = 'none';
};

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const image = document.getElementById('image').value.trim();
    const description = document.getElementById('description').value.trim();
    const tagsStr = document.getElementById('tags').value.trim();

    if (!name || isNaN(price) || price <= 0) {
        alert("Please fill name and valid price");
        return;
    }

    const data = {
        name,
        price,
        image: image || null,
        description: description || null,
        tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
        updatedAt: new Date()
    };

    try {
        if (currentEditId) {
            await updateDoc(doc(db, "products", currentEditId), data);
            alert("Product updated!");
        } else {
            await addDoc(collection(db, "products"), {
                ...data,
                createdAt: new Date()
            });
            alert("Product added!");
        }
        closeModal();
        loadProducts();
    } catch (err) {
        console.error("Save error:", err);
        alert("Save failed: " + err.message);
    }
});

window.deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
        await deleteDoc(doc(db, "products", id));
        alert("Deleted");
        loadProducts();
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
};

// Initial log
console.log("TAVÉINE Admin Panel – Mobile Ready Version");
