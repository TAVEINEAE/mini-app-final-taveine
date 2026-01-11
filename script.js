let currentProduct = null;
if (window.Telegram?.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}

/* ===== DATA ===== */
const productsData = [
  { name:"Rose Box Classic", price:620, image:"box1.jpg", category:"box bestseller" },
  { name:"Velvet Rose Box", price:780, image:"box2.jpg", category:"box luxury" },
  { name:"Luxury Red Roses", price:950, image:"lux1.jpg", category:"luxury bestseller" },
  { name:"Golden Luxury Roses", price:1250, image:"lux2.jpg", category:"luxury" },
  { name:"White Vase Bouquet", price:480, image:"vase1.jpg", category:"vases" },
  { name:"Garden Vase Mix", price:520, image:"vase2.jpg", category:"vases" },

  { name:"Christmas Bloom", price:860, image:"xmas1.jpg", category:"christmas" },
  { name:"Snowflake Roses", price:920, image:"xmas2.jpg", category:"christmas luxury" },

  { name:"Forever Rose Dome", price:690, image:"forever1.jpg", category:"forever bestseller" },
  { name:"Forever Rose Heart", price:890, image:"forever2.jpg", category:"forever" },

  { name:"Birthday Surprise", price:650, image:"bday1.jpg", category:"birthday" },
  { name:"Anniversary Love", price:880, image:"ann1.jpg", category:"anniversary" },
  { name:"Sorry Bouquet", price:450, image:"sorry1.jpg", category:"sorry" },
  { name:"New Baby Pink Box", price:720, image:"baby1.jpg", category:"baby" },

  { name:"Heart Balloons Set", price:149, image:"balloon1.jpg", category:"balloons new" },
  { name:"Red Helium Balloons", price:29, image:"balloon2.jpg", category:"balloons" }
];

let wishlist = [];
let cart = [];

/* ===== MENU ===== */
function toggleMenu() {
  document.getElementById("side-menu").classList.toggle("open");
}

/* ===== RENDER ===== */
function renderProducts(list) {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = "";

  list.forEach(p => {
    const liked = wishlist.includes(p.name);
    grid.innerHTML += `
      <div class="card">
        <div class="wishlist-btn ${liked ? 'active':''}"
          onclick="toggleWishlist('${p.name}', this)">
          ${liked ? '♥':'♡'}
        </div>
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <span>${p.price} AED</span>
        <button onclick="addToCart('${p.name}')">Add to cart</button>
      </div>`;
  });
}

/* ===== FILTER ===== */
function filterProducts(cat) {
  toggleMenu();
  document.getElementById("section-title").innerText =
    cat === "all" ? "All Products" : cat.replace(/^\w/, c => c.toUpperCase());

  renderProducts(
    cat === "all"
      ? productsData
      : productsData.filter(p => p.category.includes(cat))
  );
}

/* ===== CART / WISHLIST ===== */
function addToCart(name) {
  cart.push(name);
  document.getElementById("cart-count").innerText = cart.length;
  Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
}

function toggleWishlist(name, btn) {
  if (wishlist.includes(name)) {
    wishlist = wishlist.filter(i => i !== name);
    btn.classList.remove("active");
    btn.textContent = "♡";
  } else {
    wishlist.push(name);
    btn.classList.add("active");
    btn.textContent = "♥";
  }
  document.getElementById("wish-count").innerText = wishlist.length;
}

/* ===== MODALS ===== */
function openWishlist() {
  const box = document.getElementById("wishlistBox");
  box.innerHTML = wishlist.length
    ? wishlist.map(n => `<div class="wishlist-item">${n}</div>`).join("")
    : "<p style='text-align:center'>Wishlist empty</p>";
  box.innerHTML += `<button class="wishlist-ok" onclick="closeWishlist()">OK</button>`;
  document.getElementById("wishlistModal").style.display = "flex";
}

function closeWishlist() {
  document.getElementById("wishlistModal").style.display = "none";
}

function showStatic(type) {
  toggleMenu();
  document.getElementById("products-grid").innerHTML =
    `<p style="text-align:center;padding:40px">${type.toUpperCase()} PAGE</p>`;
}

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  renderProducts(productsData);
});

function openProduct(product) {
  currentProduct = product;

  document.getElementById("product-img").src = product.image;
  document.getElementById("product-title").innerText = product.name;
  document.getElementById("product-price").innerText = product.price + " AED";
  document.getElementById("product-desc").innerText =
    product.desc || "Luxury floral arrangement by TAVÉINE.";

  document.getElementById("product-page").style.display = "block";
}

function closeProduct() {
  document.getElementById("product-page").style.display = "none";
}

function addCurrentToCart() {
  if (!currentProduct) return;
  cart.push(currentProduct);
  document.getElementById("cart-count").innerText = cart.length;
}

const popupProducts = [
  { name: "Luxury Heart Roses", image: "heart2.jpg" },
  { name: "Forever Heart Roses", image: "heart3.jpg" },
  { name: "Rose Box Classic", image: "box1.jpg" },
  { name: "Luxury Red Roses", image: "lux1.jpg" }
];

function showPurchasePopup() {
  const item = popupProducts[
    Math.floor(Math.random() * popupProducts.length)
  ];

  const minutes = Math.floor(Math.random() * 55) + 5;

  document.getElementById("popup-img").src = item.image;
  document.getElementById("popup-name").innerText =
    `Someone purchased ${item.name}`;
  document.getElementById("popup-time").innerText =
    `${minutes} minutes ago`;

  const popup = document.getElementById("purchase-popup");
  popup.style.display = "flex";

  setTimeout(() => {
    popup.style.display = "none";
  }, 4000);
}

setTimeout(() => {
  showPurchasePopup();
  setInterval(showPurchasePopup, 20000);
}, 5000);