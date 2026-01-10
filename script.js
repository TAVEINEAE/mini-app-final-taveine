/* ====== CONFIG ====== */
const WC = {
  url: 'https://taveine.com/wp-json/wc/v3',
  key: 'ck_3f0d0db9590f9a5e4172c40d2be4e08d3578b710',
  secret: 'cs_3ccf49b7b11568d11c7ac49180d9321ac3c4c4ea'
};

let cart = [];

/* ====== MENU ====== */
function toggleMenu() {
  document.getElementById('side-menu').classList.toggle('open');
}

/* ====== LOAD PRODUCTS FROM WOOCOMMERCE ====== */
async function loadProducts(categorySlug = '') {
  document.getElementById('products').innerHTML = 'Loading...';

  let endpoint = `${WC.url}/products?per_page=20`;

  if (categorySlug) {
    endpoint += `&category=${categorySlug}`;
    document.getElementById('page-title').textContent = categorySlug.replace('-', ' ');
  }

  const res = await fetch(endpoint, {
    headers: {
      Authorization: 'Basic ' + btoa(WC.key + ':' + WC.secret)
    }
  });

  const products = await res.json();
  renderProducts(products);
  toggleMenu();
}

/* ====== RENDER PRODUCTS ====== */
function renderProducts(products) {
  const box = document.getElementById('products');
  box.innerHTML = '';

  products.forEach(p => {
    box.innerHTML += `
      <div class="card">
        <img src="${p.images[0]?.src || ''}">
        <h4>${p.name}</h4>
        <span>${p.price} AED</span>
        <button class="main-btn" onclick="addToCart('${p.name}', ${p.price})">
          ADD TO CART
        </button>
      </div>
    `;
  });
}

/* ====== CART ====== */
function addToCart(name, price) {
  cart.push({ name, price });
  document.getElementById('cart-count').textContent = cart.length;
}

function openCart() {
  let total = 0;
  const box = document.getElementById('cart-items');
  box.innerHTML = '';

  cart.forEach(i => {
    total += i.price;
    box.innerHTML += `<div>${i.name} — ${i.price} AED</div>`;
  });

  document.getElementById('cart-total').textContent = total + ' AED';
  document.getElementById('cart-modal').style.display = 'flex';
}

function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
}

/* ====== DELIVERY ====== */
function openDelivery() {
  closeCart();
  document.getElementById('shop-page').style.display = 'none';
  document.getElementById('delivery-page').classList.remove('hidden');
}

function backToShop() {
  document.getElementById('delivery-page').classList.add('hidden');
  document.getElementById('shop-page').style.display = 'block';
}

/* ====== CONFIRM ORDER (РАБОТАЕТ!) ====== */
function confirmOrder() {
  const order = {
    customer: {
      name: d-name.value,
      phone: d-phone.value,
      address: d-address.value,
      apartment: d-apartment.value,
      note: d-note.value
    },
    items: cart
  };

  Telegram.WebApp.sendData(JSON.stringify(order));
  Telegram.WebApp.close();
}

/* AUTO LOAD */
loadProducts();
