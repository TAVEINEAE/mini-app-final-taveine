/* ===== TELEGRAM ===== */
if (window.Telegram && Telegram.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}

/* ===== DATA ===== */
const productsData = [
  { name: "Rose Box Classic", price: 620, image: "box1.jpg", category: "box" },
  { name: "Rose Box Deluxe", price: 720, image: "box2.jpg", category: "box" },
  { name: "Velvet Rose Box", price: 790, image: "box3.jpg", category: "box" },

  { name: "Luxury Red Roses", price: 950, image: "lux1.jpg", category: "luxury" },
  { name: "Golden Luxury Roses", price: 1100, image: "lux2.jpg", category: "luxury" },
  { name: "Royal Roses", price: 1250, image: "lux3.jpg", category: "luxury" },

  { name: "White Elegance Vase", price: 480, image: "vase1.jpg", category: "vases" },
  { name: "Green Garden Vase", price: 520, image: "vase2.jpg", category: "vases" },
  { name: "Classic Glass Vase", price: 560, image: "vase3.jpg", category: "vases" },

  { name: "Christmas Bloom", price: 780, image: "xmas1.jpg", category: "christmas" },
  { name: "Winter Red Box", price: 860, image: "xmas2.jpg", category: "christmas" },
  { name: "Snowflake Roses", price: 920, image: "xmas3.jpg", category: "christmas" },

  { name: "Birthday Surprise", price: 690, image: "bday1.jpg", category: "birthday" },
  { name: "Anniversary Love", price: 890, image: "ann1.jpg", category: "anniversary" },
  { name: "Sorry Bouquet", price: 480, image: "sorry1.jpg", category: "sorry" },
  { name: "New Baby Pink Box", price: 720, image: "baby1.jpg", category: "baby" }
];

/* ===== STATE ===== */
let cart = [];
let wishlist = [];

/* ===== MENU ===== */
function toggleMenu(forceClose = false) {
  const menu = document.getElementById("side-menu");
  if (forceClose) menu.classList.remove("open");
  else menu.classList.toggle("open");
}

/* ===== RENDER PRODUCTS ===== */
function renderProducts(list) {
  const box = document.getElementById("products-grid");
  if (!box) return;

  box.innerHTML = "";

  list.forEach(p => {
    const liked = wishlist.includes(p.name);

    box.innerHTML += `
      <div class="card">
        <div class="wishlist-btn ${liked ? 'active' : ''}" 
             onclick="toggleWishlist('${p.name}', this)">
          ${liked ? '♥' : '♡'}
        </div>

        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <span>${p.price} AED</span>
        <button onclick="addToCart('${p.name}', ${p.price})">
          Add to cart
        </button>
      </div>
    `;
  });
}

/* ===== FILTER ===== */
function filterProducts(cat) {
  toggleMenu(true);

  if (cat === "all") {
    renderProducts(productsData);
  } else {
    renderProducts(productsData.filter(p => p.category === cat));
  }
}

/* ===== CART ===== */
function addToCart(name, price) {
  cart.push({ name, price });
  Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  alert(name + " added to cart");
}

/* ===== WISHLIST ===== */
function toggleWishlist(name, btn) {
  if (wishlist.includes(name)) {
    wishlist = wishlist.filter(i => i !== name);
    btn.textContent = "♡";
    btn.classList.remove("active");
  } else {
    wishlist.push(name);
    btn.textContent = "♥";
    btn.classList.add("active");
  }

  Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
}

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  renderProducts(productsData);
});