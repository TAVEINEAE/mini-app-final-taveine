/* ================= MENU ================= */
function toggleMenu() {
  document.getElementById('side-menu').classList.toggle('open');
}

/* ================= DATA ================= */
const products = {
  christmas: [
    { title: 'Snowfall Serenity', price: 620, img: 'p1.jpg' },
    { title: 'Golden Pine', price: 640, img: 'p2.jpg' }
  ],
  luxury: [
    { title: 'Pink Roses', price: 950, img: 'p3.jpg' }
  ],
  spring: [
    { title: 'Spring Bloom', price: 520, img: 'p4.jpg' }
  ]
};

/* ================= WISHLIST ================= */
let wishlist = [];

/* ================= CART ================= */
let cart = [];
let currentProduct = null;

/* ================= RENDER ================= */
function renderProducts(category) {
  document.getElementById('page-title').textContent =
    category.charAt(0).toUpperCase() + category.slice(1) + ' Collection';

  const container = document.getElementById('products');
  container.innerHTML = '';

  products[category].forEach(p => {
    container.innerHTML += `
      <div class="card">
        <img src="${p.img}" onclick="openProduct(${JSON.stringify(p).replace(/"/g, '&quot;')})">
        <button class="heart" onclick="toggleWishlist('${p.title}',${p.price},'${p.img}', this)">♥</button>
        <h4>${p.title}</h4>
        <span>${p.price} AED</span>
      </div>
    `;
  });

  toggleMenu();
}

/* ================= PRODUCT MODAL ================= */
function openProduct(product) {
  currentProduct = product;
  document.getElementById('modal-title').textContent = product.title;
  document.getElementById('modal-price').textContent = product.price + ' AED';
  document.getElementById('modal-img').src = product.img;
  document.getElementById('product-modal').style.display = 'flex';
}

function closeProduct() {
  document.getElementById('product-modal').style.display = 'none';
}

/* ================= CART LOGIC ================= */
function addToCart() {
  cart.push(currentProduct);
  document.getElementById('cart-count').textContent = cart.length;
  closeProduct();
}

function openCart() {
  const box = document.getElementById('cart-items');
  box.innerHTML = '';
  let total = 0;

  cart.forEach((p, i) => {
    total += p.price;
    box.innerHTML += `
      <div class="cart-item">
        <span>${p.title}</span>
        <span>${p.price} AED</span>
        <button onclick="removeFromCart(${i})">×</button>
      </div>
    `;
  });

  document.getElementById('cart-total').textContent = total + ' AED';
  document.getElementById('cart-modal').style.display = 'flex';
}

function removeFromCart(index) {
  cart.splice(index, 1);
  document.getElementById('cart-count').textContent = cart.length;
  openCart();
}

function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
}

function checkout() {
  alert('Telegram checkout will be connected here');
}

/* ================= WISHLIST ================= */
function toggleWishlist(title, price, img, btn) {
  const index = wishlist.findIndex(i => i.title === title);

  if (index === -1) {
    wishlist.push({ title, price, img });
    btn.classList.add('active');
  } else {
    wishlist.splice(index, 1);
    btn.classList.remove('active');
  }

  document.getElementById('wish-count').textContent = wishlist.length;
}

function openWishlist() {
  const box = document.getElementById('wishlist-items');
  box.innerHTML = '';

  wishlist.forEach(p => {
    box.innerHTML += `
      <div class="wish-item">
        <img src="${p.img}">
        <div>
          <h4>${p.title}</h4>
          <span>${p.price} AED</span>
        </div>
      </div>
    `;
  });

  document.getElementById('wishlist-modal').style.display = 'flex';
}

function closeWishlist() {
  document.getElementById('wishlist-modal').style.display = 'none';
}

/* ================= AUTO LOAD ================= */
renderProducts('christmas');
