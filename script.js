let currentProduct = null;

/* ===== TELEGRAM INIT ===== */
if (window.Telegram?.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}

/* ===== DATA ===== */
const productsData = [
  {
    name:"Rose Box Classic",
    price:620,
    image:"box1.jpg",
    category:"box bestseller",
    tags:["recommended","popular"]
  },
  {
    name:"Velvet Rose Box",
    price:780,
    image:"box2.jpg",
    category:"box luxury",
    tags:["recommended"]
  },
  {
    name:"Luxury Red Roses",
    price:950,
    image:"lux1.jpg",
    category:"luxury bestseller",
    tags:["popular"]
  },
  {
    name:"Golden Luxury Roses",
    price:1250,
    image:"lux2.jpg",
    category:"luxury",
    tags:["new"]
  },
  {
    name:"White Vase Bouquet",
    price:480,
    image:"vase1.jpg",
    category:"vases",
    tags:["new"]
  },
  {
    name:"Garden Vase Mix",
    price:520,
    image:"vase2.jpg",
    category:"vases",
    tags:["recommended"]
  },

  {
    name:"Christmas Bloom",
    price:860,
    image:"xmas1.jpg",
    category:"christmas",
    tags:["popular"]
  },
  {
    name:"Snowflake Roses",
    price:920,
    image:"xmas2.jpg",
    category:"christmas luxury",
    tags:["new"]
  },

  {
    name:"Forever Rose Dome",
    price:690,
    image:"forever1.jpg",
    category:"forever bestseller",
    tags:["recommended","popular"]
  },
  {
    name:"Forever Rose Heart",
    price:890,
    image:"forever2.jpg",
    category:"forever",
    tags:["new"]
  },

  {
    name:"Birthday Surprise",
    price:650,
    image:"bday1.jpg",
    category:"birthday",
    tags:["recommended"]
  },
  {
    name:"Anniversary Love",
    price:880,
    image:"ann1.jpg",
    category:"anniversary",
    tags:["popular"]
  },
  {
    name:"Sorry Bouquet",
    price:450,
    image:"sorry1.jpg",
    category:"sorry",
    tags:["new"]
  },
  {
    name:"New Baby Pink Box",
    price:720,
    image:"baby1.jpg",
    category:"baby",
    tags:["recommended"]
  },

  {
    name:"Heart Balloons Set",
    price:149,
    image:"balloon1.jpg",
    category:"balloons",
    tags:["new"]
  },
  {
    name:"Red Helium Balloons",
    price:29,
    image:"balloon2.jpg",
    category:"balloons",
    tags:["popular"]
  }
];

let wishlist = [];
let cart = [];

/* ===== MENU ===== */
function toggleMenu() {
  const menu = document.getElementById("side-menu");
  if (!menu) return;
  menu.classList.toggle("open");
}

/* ===== RENDER HOME PRODUCTS ===== */
function renderProducts(list) {
  const grid = document.getElementById("products-grid");
  if (!grid) return;
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

/* ===== HOME FILTER (НЕ КАТАЛОГ) ===== */
function filterProducts(cat) {
  document.getElementById("side-menu").classList.remove("open");

  document.getElementById("section-title").innerText =
    cat === "all" ? "Shop All" : cat.replace(/^\w/, c => c.toUpperCase());

  renderProducts(
    cat === "all"
      ? productsData
      : productsData.filter(p => p.category.includes(cat))
  );

  document.querySelector(".products")?.scrollIntoView({ behavior:"smooth" });
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

/* ===== WISHLIST MODAL ===== */
function openWishlist() {
  const box = document.getElementById("wishlistBox");

  if (!wishlist.length) {
    box.innerHTML = "<p style='text-align:center'>Wishlist empty</p>";
  } else {
    box.innerHTML = wishlist.map(name => {
      const p = productsData.find(i => i.name === name);
      if (!p) return "";

      return `
        <div class="wishlist-item" style="display:flex;gap:12px;margin-bottom:12px;align-items:center">
          <img src="${p.image}" style="width:70px;height:70px;object-fit:cover;border-radius:8px">
          <div style="flex:1">
            <strong style="font-size:14px">${p.name}</strong><br>
            <span>${p.price} AED</span>
          </div>
          <button onclick="addToCart('${p.name}')">🛒</button>
        </div>
      `;
    }).join("");
  }

  box.innerHTML += `<button onclick="closeWishlist()">Close</button>`;
  document.getElementById("wishlistModal").style.display = "flex";
}

/* ===== PRODUCT PAGE ===== */
function openProduct(product) {
  currentProduct = product;
  document.getElementById("product-img").src = product.image;
  document.getElementById("product-title").innerText = product.name;
  document.getElementById("product-price").innerText = product.price + " AED";
  document.getElementById("product-desc").innerText =
    product.desc || "Luxury floral arrangement by TAVÉINE.";
  document.getElementById("product-page").style.display = "block";
  Telegram?.WebApp?.BackButton?.show();
}

function closeProduct() {
  document.getElementById("product-page").style.display = "none";
  Telegram?.WebApp?.BackButton?.hide();
}

function addCurrentToCart() {
  if (!currentProduct) return;
  cart.push(currentProduct.name);
  document.getElementById("cart-count").innerText = cart.length;
}

/* ===== CATEGORY PAGE (ОТДЕЛЬНЫЙ ЭКРАН) ===== */
function openCategory(cat, title) {
  document.getElementById("side-menu").classList.remove("open");

  document.querySelectorAll("body > section, footer, nav")
    .forEach(el => el.style.display = "none");

  const page = document.getElementById("category-page");
page.style.display = "block";
page.classList.add("page-slide");

requestAnimationFrame(() => {
  page.classList.add("active");
});
  document.getElementById("category-title").innerText = title;

  const grid = document.getElementById("category-grid");
  grid.innerHTML = "";

  productsData
    .filter(p => p.category.includes(cat))
    .forEach(p => {
      grid.innerHTML += `
        <div class="card">
          <img src="${p.image}">
          <h3>${p.name}</h3>
          <span>${p.price} AED</span>
          <button onclick="addToCart('${p.name}')">Add to cart</button>
        </div>`;
    });

  window.scrollTo(0,0);
  Telegram?.WebApp?.BackButton?.show();
}

function closeCategory() {
  const page = document.getElementById("category-page");
page.classList.remove("active");
page.classList.add("exit");

setTimeout(() => {
  page.style.display = "none";
  page.classList.remove("exit");
}, 350);

  document.querySelectorAll("body > section, footer, nav")
    .forEach(el => el.style.display = "");

  window.scrollTo(0,0);
  Telegram?.WebApp?.BackButton?.hide();
}

/* ===== ABOUT US (ИСПРАВЛЕНО) ===== */
function openAbout() {
  document.getElementById("side-menu").classList.remove("open");

  document.querySelectorAll("body > section, footer, nav")
    .forEach(el => el.style.display = "none");

  document.getElementById("about-page").style.display = "block";
  window.scrollTo(0,0);
  Telegram?.WebApp?.BackButton?.show();
}

function closeAbout() {
  document.getElementById("about-page").style.display = "none";

  document.querySelectorAll("body > section, footer, nav")
    .forEach(el => el.style.display = "");

  window.scrollTo(0,0);
  Telegram?.WebApp?.BackButton?.hide();
}

/* ===== TELEGRAM BACK BUTTON ===== */
if (Telegram?.WebApp?.BackButton) {
  Telegram.WebApp.BackButton.onClick(() => {
    if (document.getElementById("category-page")?.style.display === "block") {
      closeCategory();
    } else if (document.getElementById("about-page")?.style.display === "block") {
      closeAbout();
    } else if (document.getElementById("product-page")?.style.display === "block") {
      closeProduct();
    }
  });
}

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  renderProducts(productsData);
});

/* ================= SEARCH PAGE ================= */

function openSearch() {
  document
    .querySelectorAll("body > section:not(#search-page), footer, nav")
    .forEach(el => el.style.display = "none");

  document.getElementById("search-page").style.display = "block";
  document.getElementById("search-input").value = "";
  document.getElementById("search-input").focus();

  renderSearch(productsData);
  Telegram?.WebApp?.BackButton?.show();
}

function closeSearch() {
  document.getElementById("search-page").style.display = "none";

  document
    .querySelectorAll("body > section:not(#search-page), footer, nav")
    .forEach(el => el.style.display = "");

  Telegram?.WebApp?.BackButton?.hide();
}

function searchAll(text) {
  const value = text.toLowerCase().trim();

  const filtered = productsData.filter(p =>
    p.name.toLowerCase().includes(value)
  );

  renderSearch(filtered);
}

function renderSearch(list) {
  const grid = document.getElementById("search-grid");
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `<p style="text-align:center;padding:40px">
      Nothing found
    </p>`;
    return;
  }

  list.forEach(p => {
    grid.innerHTML += `
      <div class="card">
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <span>${p.price} AED</span>
        <button onclick="addToCart('${p.name}')">Add to cart</button>
      </div>
    `;
  });
}

/* ===== SEARCH SUGGESTIONS ===== */

const searchTags = [
  "rose",
  "box",
  "luxury",
  "heart",
  "forever",
  "vase",
  "balloon",
  "birthday",
  "anniversary",
  "christmas"
];

function updateSuggestions(value) {
  const box = document.getElementById("search-suggestions");
  box.innerHTML = "";

  if (!value) return;

  const v = value.toLowerCase();

  searchTags
    .filter(tag => tag.includes(v))
    .slice(0, 6)
    .forEach(tag => {
      const el = document.createElement("span");
      el.textContent = tag;
      el.onclick = () => {
        document.getElementById("search-input").value = tag;
        searchAll(tag);
        box.innerHTML = "";
      };
      box.appendChild(el);
    });
}

function openCart() {
  document.querySelectorAll("body > section, footer, nav")
    .forEach(el => el.style.display = "none");

  const grid = document.getElementById("cart-grid");
if (!grid) return;
grid.innerHTML = "";

  if (!cart.length) {
    grid.innerHTML = "<p>Cart is empty</p>";
  } else {
    cart.forEach(name => {
      const p = productsData.find(i => i.name === name);
      if (!p) return;

      grid.innerHTML += `
        <div class="card">
          <img src="${p.image}">
          <h3>${p.name}</h3>
          <span>${p.price} AED</span>
        </div>
      `;
    });
  }

  document.getElementById("cart-page").style.display = "block";
  Telegram?.WebApp?.BackButton?.show();
}

function closeCart() {
  document.getElementById("cart-page").style.display = "none";
  document.querySelectorAll("body > section, footer, nav")
    .forEach(el => el.style.display = "");
  Telegram?.WebApp?.BackButton?.hide();
}

/* ================= EXPLORE TABS ================= */

function switchTab(tag, btn) {
  document.querySelectorAll('.tab').forEach(b =>
    b.classList.remove('active')
  );
  btn.classList.add('active');

  let filtered = [];

  if (tag === 'recommended') {
    filtered = productsData.filter(p =>
      p.tags && p.tags.includes('recommended')
    );
  }

  if (tag === 'new') {
    filtered = productsData.filter(p =>
      p.tags && p.tags.includes('new')
    );
  }

  if (tag === 'popular') {
    filtered = productsData.filter(p =>
      p.tags && p.tags.includes('popular')
    );
  }

  renderProducts(filtered.length ? filtered : productsData);
}