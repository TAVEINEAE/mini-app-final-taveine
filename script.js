/* ========== MENU ========== */
function toggleMenu() {
  document.getElementById('side-menu').classList.toggle('open');
}

/* ========== DATA ========== */
const products = {
  christmas: [
    { title: 'Snowfall Serenity', price: '620 AED', img: 'p1.jpg' },
    { title: 'Golden Pine', price: '640 AED', img: 'p2.jpg' }
  ],
  luxury: [
    { title: 'Pink Roses', price: '950 AED', img: 'p3.jpg' }
  ],
  spring: [
    { title: 'Spring Bloom', price: '520 AED', img: 'p4.jpg' }
  ]
};

/* ========== RENDER PRODUCTS ========== */
function renderProducts(category) {
  const title =
    category.charAt(0).toUpperCase() +
    category.slice(1) +
    ' Collection';

  document.getElementById('page-title').textContent = title;

  const container = document.getElementById('products');
  container.innerHTML = '';

  products[category].forEach(p => {
    container.innerHTML += `
      <div class="card" onclick="openProduct('${p.title}','${p.price}','${p.img}')">
        <img src="${p.img}">
        <h4>${p.title}</h4>
        <span>${p.price}</span>
      </div>
    `;
  });

  toggleMenu();
}

/* ========== MODAL ========== */
function openProduct(title, price, img) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-price').textContent = price;
  document.getElementById('modal-img').src = img;
  document.getElementById('product-modal').style.display = 'flex';
}

function closeProduct() {
  document.getElementById('product-modal').style.display = 'none';
}

/* ========== AUTO LOAD ========== */
renderProducts('christmas');
