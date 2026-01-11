if (window.Telegram && Telegram.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}
/**************** CONFIG ****************/
const WC = {
  url: 'https://taveine.com/wp-json/wc/v3',
  key: 'ck_3f0d0db9590f9a5e4172c40d2be4e08d3578b710',
  secret: 'cs_3ccf49b7b11568d11c7ac49180d9321ac3c4c4ea'
};

/* slug → Woo category ID */
const CATEGORY_MAP = {
  'christmas-collection': 21,
  'best-sellers': 34,
  'luxury': 18,
  'vases': 25,
  'box': 26,
  'anniversary': 41,
  'birthday': 42
};

let cart = [];

/**************** MENU ****************/
function toggleMenu() {
  document.getElementById('side-menu').classList.toggle('open');
}

/**************** LOAD PRODUCTS ****************/
async function loadProducts(categorySlug = '') {
  const box = document.getElementById('products');
  box.innerHTML = 'Loading…';

  let endpoint = `${WC.url}/products?per_page=20`;

  if (categorySlug && CATEGORY_MAP[categorySlug]) {
    endpoint += `&category=${CATEGORY_MAP[categorySlug]}`;
    document.getElementById('page-title').innerText =
      categorySlug.replace(/-/g, ' ');
  } else {
    document.getElementById('page-title').innerText = 'Shop All';
  }

  try {
    const res = await fetch(endpoint, {
      headers: {
        Authorization: 'Basic ' + btoa(WC.key + ':' + WC.secret)
      }
    });

    const products = await res.json();
    renderProducts(products);
    toggleMenu();
  } catch (e) {
    box.innerHTML = 'Failed to load products';
  }
}

/**************** RENDER ****************/
function renderProducts(products) {
  const box = document.getElementById('products');
  box.innerHTML = '';

  products.forEach(p => {
    const price = Number(p.price || 0);

    box.innerHTML += `
      <div class="card">
        <img src="${p.images?.[0]?.src || ''}">
        <h4>${p.name}</h4>
        <span>${price} AED</span>
        <button class="main-btn"
          onclick="addToCart('${p.name}', ${price})">
          ADD TO CART
        </button>
      </div>
    `;
  });
}

/**************** CART ****************/
function addToCart(name, price) {
  cart.push({ name, price });
  document.getElementById('cart-count').innerText = cart.length;
}

function openCart() {
  let total = 0;
  const box = document.getElementById('cart-items');
  box.innerHTML = '';

  cart.forEach((i, idx) => {
    total += i.price;
    box.innerHTML += `
      <div>
        ${i.name} — ${i.price} AED
        <button onclick="removeFromCart(${idx})">×</button>
      </div>
    `;
  });

  document.getElementById('cart-total').innerText = total + ' AED';
  document.getElementById('cart-modal').style.display = 'flex';
}

function removeFromCart(i) {
  cart.splice(i, 1);
  document.getElementById('cart-count').innerText = cart.length;
  openCart();
}

function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
}

/**************** DELIVERY ****************/
function openDelivery() {
  closeCart();
  document.getElementById('shop-page').style.display = 'none';
  document.getElementById('delivery-page').classList.remove('hidden');
}

function backToShop() {
  document.getElementById('delivery-page').classList.add('hidden');
  document.getElementById('shop-page').style.display = 'block';
}

/**************** CONFIRM ORDER (FIXED 100%) ****************/
function confirmOrder() {
  if (!window.Telegram || !Telegram.WebApp) {
    alert('Open this inside Telegram');
    return;
  }

  const order = {
    customer: {
      name: document.getElementById('d-name').value,
      phone: document.getElementById('d-phone').value,
      address: document.getElementById('d-address').value,
      apartment: document.getElementById('d-apartment').value,
      note: document.getElementById('d-note').value
    },
    items: cart,
    total: cart.reduce((s, i) => s + i.price, 0)
  };

  Telegram.WebApp.sendData(JSON.stringify(order));
  Telegram.WebApp.close();
}

/**************** INIT ****************/
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});

/* AUTO LOAD */
loadProducts();
const productsData = [
  { name: "Rose Box", price: 620, image: "p1.jpg", category: "box" },
  { name: "Luxury Roses", price: 950, image: "p2.jpg", category: "luxury" },
  { name: "White Elegance", price: 780, image: "p3.jpg", category: "christmas" },
  { name: "Golden Bloom", price: 1100, image: "p4.jpg", category: "luxury" },
  { name: "Glass Vase Flowers", price: 520, image: "p5.jpg", category: "vases" },
  { name: "Baby Pink Box", price: 690, image: "p6.jpg", category: "baby" },
  { name: "Sorry Bouquet", price: 480, image: "p7.jpg", category: "sorry" },
  { name: "Anniversary Roses", price: 890, image: "p8.jpg", category: "anniversary" }
];

function renderProducts(list) {
  const box = document.getElementById("products");
  box.innerHTML = "";

  list.forEach(p => {
    box.innerHTML += `
      <div class="product">
        <img src="${p.image}">
        <p>${p.name}</p>
        <strong>${p.price} AED</strong>
      </div>
    `;
  });
}

function loadCollection(cat) {
  toggleMenu(false);

  if (cat === "all") {
    renderProducts(productsData);
    sectionTitle.textContent = "Shop All";
  } else {
    renderProducts(productsData.filter(p => p.category === cat));
    sectionTitle.textContent = cat.toUpperCase();
  }
}

function toggleMenu(forceClose = null) {
  const menu = document.getElementById("side-menu");
  if (forceClose === false) menu.classList.remove("open");
  else menu.classList.toggle("open");
}

loadCollection("all");