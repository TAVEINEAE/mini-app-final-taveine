/* MENU */
function toggleMenu() {
  document.getElementById('side-menu').classList.toggle('open');
}

/* DATA */
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

/* WISHLIST */
let wishlist = [];

/* RENDER PRODUCTS */
function renderProducts(category) {
  document.getElementById('page-title').textContent =
    category.charAt(0).toUpperCase() + category.slice(1) + ' Collection';

  const container = document.getElementById('products');
  container.innerHTML = '';

  products[category].forEach(p => {
    container.innerHTML += `
      <div class="card">
        <img src="${p.img}" onclick="openProduct('${p.title}','${p.price}','${p.img}')">
        <button class="heart" onclick="toggleWishlist('${p.title}','${p.price}','${p.img}', this)">♥</button>
        <h4>${p.title}</h4>
        <span>${p.price}</span>
      </div>
    `;
  });

  toggleMenu();
}

/* WISHLIST LOGIC */
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
          <span>${p.price}</span>
        </div>
      </div>
    `;
  });

  document.getElementById('wishlist-modal').style.display = 'flex';
}

function closeWishlist() {
  document.getElementById('wishlist-modal').style.display = 'none';
}

/* MODAL */
function openProduct(title, price, img) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-price').textContent = price;
  document.getElementById('modal-img').src = img;
  document.getElementById('product-modal').style.display = 'flex';
}

function closeProduct() {
  document.getElementById('product-modal').style.display = 'none';
}

/* AUTO LOAD */
renderProducts('christmas');
