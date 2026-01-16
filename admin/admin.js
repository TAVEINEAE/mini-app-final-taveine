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

// Page switching
document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const page = link.dataset.page + '-page';

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page)?.classList.add('active');

        document.getElementById('page-title').textContent = link.textContent.trim();

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Close sidebar on mobile
        if (window.innerWidth < 993) toggleSidebar();

        if (page === 'inventory-page') loadProducts();
    });
});

// Sidebar toggle
window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
};

// Product management
let editId = null;

async function loadProducts() {
    try {
        const snap = await getDocs(collection(db, "products"));
        const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderProducts(products);
    } catch (e) {
        console.error(e);
        alert("Failed to load products: " + e.message);
    }
}

function renderProducts(products) {
    const cont = document.getElementById('products-list');
    cont.innerHTML = products.map(p => `
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
        tags: document.getElementById('tags').value.split(',').map(t=>t.trim()).filter(Boolean)
    };

    if (!data.name || isNaN(data.price) || data.price <= 0) {
        alert("Name and valid price are required!");
        return;
    }

    try {
        if (editId) {
            await updateDoc(doc(db, "products", editId), data);
            alert("Updated!");
        } else {
            await addDoc(collection(db, "products"), data);
            alert("Added!");
        }
        closeModal();
        loadProducts();
    } catch (err) {
        alert("Save failed: " + err.message);
        console.error(err);
    }
});

window.deleteProduct = async id => {
    if (!confirm("Delete?")) return;
    try {
        await deleteDoc(doc(db, "products", id));
        loadProducts();
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
};

console.log("Admin Panel Ready");
