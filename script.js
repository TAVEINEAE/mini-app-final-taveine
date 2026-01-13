:root { --green: #1f3f38; --gray: #f4f4f4; --text: #333; }
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
body { font-family: 'Segoe UI', sans-serif; background: #fff; color: var(--text); }

.top-bar { background: var(--green); height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; position: sticky; top: 0; z-index: 1000; color: #fff; }
.hero-img { width: 100%; height: auto; display: block; }

.section-title { padding: 20px 15px 10px; font-size: 18px; font-weight: bold; color: var(--green); text-transform: uppercase; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 15px; }

/* Карта товара в сетке */
.card { border: 1px solid #eee; border-radius: 4px; overflow: hidden; position: relative; }
.card img { width: 100%; aspect-ratio: 1/1; object-fit: cover; }
.card-info { padding: 10px; }
.card-info h4 { font-size: 13px; color: #555; height: 32px; overflow: hidden; margin-bottom: 5px; }
.card-info b { font-size: 14px; color: #000; }
.add-btn { width: 100%; border: 1px solid #000; background: #fff; padding: 8px; margin-top: 10px; font-size: 12px; text-transform: uppercase; }

/* Стили корзины со скриншота */
.cart-item { display: flex; padding: 15px; border-bottom: 1px solid #eee; gap: 15px; }
.cart-item img { width: 80px; height: 80px; object-fit: cover; }
.cart-item-info { flex: 1; }
.cart-item-info h4 { font-size: 14px; margin-bottom: 4px; }
.cart-item-info p { font-size: 14px; font-weight: bold; margin-bottom: 10px; }

.qty-control { display: flex; align-items: center; border: 1px solid #ddd; width: fit-content; border-radius: 4px; }
.qty-control button { border: none; background: none; padding: 5px 10px; font-size: 18px; }
.qty-control span { padding: 0 10px; font-size: 14px; }

.remove-link { color: #666; font-size: 12px; text-decoration: underline; margin-left: 15px; border:none; background:none;}

.cart-summary-fixed { position: fixed; bottom: 85px; left: 0; width: 100%; background: #fff; border-top: 1px solid #eee; padding: 15px; z-index: 4001; }
.subtotal-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
.cart-btns { display: flex; gap: 10px; }
.white-btn { flex: 1; border: 1px solid #000; background: #fff; padding: 12px; font-weight: bold; }
.black-checkout-btn { flex: 1; background: #000; color: #fff; border: none; padding: 12px; font-weight: bold; }

/* Пустые состояния */
.empty-state { text-align: center; padding: 100px 20px; }
.empty-state h2 { font-size: 22px; margin-bottom: 15px; }
.black-btn { background: #000; color: #fff; padding: 15px 30px; border: none; text-transform: uppercase; margin-top: 20px; }

.full-page { position: fixed; inset: 0; background: #fff; z-index: 4000; display: none; overflow-y: auto; padding-bottom: 180px;}
.p-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; }
