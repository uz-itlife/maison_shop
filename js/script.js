// =========================================
// ДАННЫЕ
// =========================================
let products = [];
let cart = [];

const PAGE_SIZE = 8;
let currentPage = 1;
let currentFilter = 'all';
let filteredProducts = [];

// =========================================
// ЗАГРУЗКА ТОВАРОВ
// =========================================
async function loadProducts() {
  const stored = localStorage.getItem('maison_products');
  const images = JSON.parse(localStorage.getItem('maison_images') || '{}');

  if (stored) {
    products = JSON.parse(stored);
    products = products.map(p => ({ ...p, imageData: images[p.id] || null }));
    renderProducts('all');
    return;
  }

  try {
    const res = await fetch('data/products.json');
    if (res.ok) { products = await res.json(); }
    else { products = getDefaultProducts(); }
  } catch { products = getDefaultProducts(); }

  renderProducts('all');
}

function getDefaultProducts() {
  return [
    { id:1,  name:"Шёлковое макси-платье",  category:"Платья",    badge:"new",  filter:"new",  stars:5, price:850000,  oldPrice:null,    sizes:["XS","S","M","L"],      colors:["#1a1a1a","#c9a96e","#ffffff","#8b4513"], image:"", imageData:null, description:"Элегантное платье из натурального шёлка. Идеально для особых случаев.", inStock:true },
    { id:2,  name:"Льняной блейзер",         category:"Жакеты",   badge:"hit",  filter:"hit",  stars:5, price:690000,  oldPrice:980000,  sizes:["S","M","L","XL"],      colors:["#8a7560","#2d2d2d","#f5f0e8"],          image:"", imageData:null, description:"Лёгкий льняной блейзер — основа делового гардероба.",                 inStock:true },
    { id:3,  name:"Кожаные брюки Slim",      category:"Брюки",    badge:"sale", filter:"sale", stars:4, price:420000,  oldPrice:600000,  sizes:["XS","S","M"],          colors:["#1a1a1a","#4a3728"],                    image:"", imageData:null, description:"Стильные брюки из эко-кожи, облегающий силуэт.",                       inStock:true },
    { id:4,  name:"Кашемировый свитер",      category:"Трикотаж", badge:"new",  filter:"new",  stars:5, price:560000,  oldPrice:null,    sizes:["S","M","L"],           colors:["#c9a96e","#8b4513","#2d2d2d","#f5f0e8"], image:"", imageData:null, description:"Мягкий свитер из натурального кашемира.",                              inStock:true },
    { id:5,  name:"Джинсы Wide Leg",         category:"Джинсы",   badge:"hit",  filter:"hit",  stars:5, price:380000,  oldPrice:null,    sizes:["XS","S","M","L","XL"], colors:["#2c3e6b","#1a1a1a","#5c4a3a"],          image:"", imageData:null, description:"Широкие джинсы в стиле 90-х.",                                         inStock:true },
    { id:6,  name:"Шёлковый топ",            category:"Топы",     badge:"sale", filter:"sale", stars:4, price:220000,  oldPrice:275000,  sizes:["XS","S","M"],          colors:["#f5f0e8","#c9a96e","#1a1a1a","#8b1a1a"], image:"", imageData:null, description:"Лёгкий шёлковый топ на тонких бретелях.",                              inStock:true },
    { id:7,  name:"Пальто оверсайз",         category:"Верхняя",  badge:"new",  filter:"new",  stars:5, price:1250000, oldPrice:null,    sizes:["S","M","L"],           colors:["#2d2d2d","#8a7560","#c9a96e"],          image:"", imageData:null, description:"Пальто свободного кроя из шерстяного драпа.",                          inStock:true },
    { id:8,  name:"Льняная юбка миди",       category:"Юбки",     badge:"hit",  filter:"hit",  stars:5, price:310000,  oldPrice:420000,  sizes:["XS","S","M","L"],      colors:["#f5f0e8","#c9a96e","#5c4a3a"],          image:"", imageData:null, description:"Лёгкая льняная юбка миди-длины.",                                      inStock:true },
    { id:9,  name:"Шерстяное пальто",        category:"Верхняя",  badge:"new",  filter:"new",  stars:5, price:1450000, oldPrice:null,    sizes:["S","M","L"],           colors:["#1a1a1a","#8a7560"],                    image:"", imageData:null, description:"Классическое пальто из итальянской шерсти.",                           inStock:true },
    { id:10, name:"Атласная блузка",         category:"Топы",     badge:"hit",  filter:"hit",  stars:4, price:290000,  oldPrice:null,    sizes:["XS","S","M","L"],      colors:["#f5f0e8","#c9a96e","#8b1a1a","#2c3e6b"], image:"", imageData:null, description:"Лёгкая атласная блузка с запахом.",                                    inStock:true },
    { id:11, name:"Велюровый костюм",        category:"Жакеты",   badge:"sale", filter:"sale", stars:5, price:780000,  oldPrice:1100000, sizes:["S","M","L"],           colors:["#1a1a1a","#4a1a4a","#8b4513"],          image:"", imageData:null, description:"Велюровый костюм — брюки + жакет.",                                    inStock:true },
    { id:12, name:"Льняные шорты",           category:"Брюки",    badge:"new",  filter:"new",  stars:4, price:195000,  oldPrice:null,    sizes:["XS","S","M","L"],      colors:["#f5f0e8","#8a7560","#2d2d2d"],          image:"", imageData:null, description:"Лёгкие льняные шорты для лета.",                                       inStock:true },
    { id:13, name:"Трикотажное платье",      category:"Платья",   badge:"hit",  filter:"hit",  stars:5, price:460000,  oldPrice:null,    sizes:["S","M","L"],           colors:["#1a1a1a","#c9a96e","#8b1a1a"],          image:"", imageData:null, description:"Облегающее трикотажное платье миди.",                                  inStock:true },
    { id:14, name:"Джинсовая куртка",        category:"Верхняя",  badge:"sale", filter:"sale", stars:4, price:520000,  oldPrice:720000,  sizes:["S","M","L","XL"],      colors:["#2c3e6b","#1a1a1a"],                    image:"", imageData:null, description:"Классическая джинсовая куртка оверсайз.",                              inStock:true },
    { id:15, name:"Шёлковая юбка плиссе",    category:"Юбки",     badge:"new",  filter:"new",  stars:5, price:380000,  oldPrice:null,    sizes:["XS","S","M"],          colors:["#c9a96e","#f5f0e8","#8b1a1a"],          image:"", imageData:null, description:"Юбка плиссе из лёгкого шёлка.",                                        inStock:true },
    { id:16, name:"Кашемировое худи",        category:"Трикотаж", badge:"hit",  filter:"hit",  stars:5, price:890000,  oldPrice:null,    sizes:["S","M","L","XL"],      colors:["#f5f0e8","#2d2d2d","#c9a96e"],          image:"", imageData:null, description:"Мягкое худи из 100% кашемира.",                                        inStock:true },
  ];
}

// =========================================
// РЕНДЕР КАРТОЧЕК
// =========================================
function renderProducts(filter) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  currentFilter = filter;
  currentPage = 1;
  filteredProducts = filter === 'all' ? products : products.filter(p => p.filter === filter);
  grid.innerHTML = '';
  appendProductCards(filteredProducts.slice(0, PAGE_SIZE));
  updateLoadMoreBtn();
  observeFadeUp();
}

function appendProductCards(list) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.insertAdjacentHTML('beforeend', list.map(p => {
    const imgSrc = p.imageData || p.image;
    const badgeClass = { new:'badge-new', sale:'badge-sale', hit:'badge-hit' }[p.badge] || 'badge-new';
    const badgeLabel = { new:'Новинка', sale:'Скидка', hit:'Хит' }[p.badge] || p.badge;
    const starsStr = '★'.repeat(p.stars) + '☆'.repeat(5 - p.stars);
    const catEmoji = getCatEmoji(p.category);
    const imageBlock = imgSrc
      ? `<img src="${imgSrc}" alt="${p.name}" class="product-real-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const placeholderStyle = imgSrc ? 'display:none' : '';

    return `
      <div class="product-card fade-up" data-id="${p.id}">
        <div class="product-image-wrap">
          ${imageBlock}
          <div class="product-placeholder ${getCatColor(p.category)}" style="${placeholderStyle}">${catEmoji}</div>
          <span class="product-badge ${badgeClass}">${badgeLabel}</span>
          <div class="product-actions">
            <button class="product-action-btn" onclick="addToWishlist(${p.id})" title="В избранное">♡</button>
            <button class="product-action-btn" onclick="openProductModal(${p.id})" title="Быстрый просмотр">👁</button>
          </div>
          ${(p.sizes && p.sizes.length) ? `
          <div class="product-sizes-hover">
            ${p.sizes.map(s => `<span class="size-tag">${s}</span>`).join('')}
          </div>` : ''}
        </div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-footer">
            <div>
              <span class="product-price">${Number(p.price).toLocaleString('ru')} сум</span>
              ${p.oldPrice ? `<span class="product-price-old">${Number(p.oldPrice).toLocaleString('ru')}</span>` : ''}
            </div>
            <div class="product-stars">${starsStr}</div>
          </div>
          <button class="add-to-cart" onclick="openProductModal(${p.id})">Выбрать размер →</button>
        </div>
      </div>`;
  }).join(''));

  observeFadeUp();
}

// =========================================
// ПАГИНАЦИЯ
// =========================================
function loadMore() {
  const shown = currentPage * PAGE_SIZE;
  const next = filteredProducts.slice(shown, shown + PAGE_SIZE);
  if (!next.length) return;
  currentPage++;
  appendProductCards(next);
  updateLoadMoreBtn();
}

function updateLoadMoreBtn() {
  const btn = document.getElementById('loadMoreBtn');
  if (!btn) return;
  const remaining = filteredProducts.length - currentPage * PAGE_SIZE;
  if (remaining <= 0) { btn.style.display = 'none'; }
  else { btn.style.display = 'inline-flex'; btn.textContent = `Загрузить ещё (${remaining})`; }
}

function filterProducts(btn, filter) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderProducts(filter);
}

// =========================================
// МОДАЛЬНОЕ ОКНО ТОВАРА (размер + цвет)
// =========================================
let selectedSize = null;
let selectedColor = null;

function openProductModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  selectedSize = null;
  selectedColor = null;

  const imgSrc = p.imageData || p.image;
  const starsStr = '★'.repeat(p.stars) + '☆'.repeat(5 - p.stars);

  // Цвета
  const colorNames = {
    '#1a1a1a':'Чёрный', '#ffffff':'Белый', '#f5f0e8':'Молочный',
    '#c9a96e':'Золотой', '#8a7560':'Бежевый', '#8b4513':'Коричневый',
    '#2d2d2d':'Тёмно-серый', '#4a3728':'Шоколадный', '#8b1a1a':'Бордовый',
    '#2c3e6b':'Тёмно-синий', '#5c4a3a':'Кофейный', '#4a1a4a':'Сливовый',
  };

  const sizesHtml = (p.sizes || []).map(s => `
    <button class="picker-size" onclick="selectSize(this, '${s}')">${s}</button>
  `).join('');

  const colorsHtml = (p.colors || []).map(c => `
    <button class="picker-color" style="background:${c}" onclick="selectColor(this, '${c}')" title="${colorNames[c] || c}">
      ${c === '#ffffff' || c === '#f5f0e8' ? '<span class="color-check">✓</span>' : '<span class="color-check">✓</span>'}
    </button>
  `).join('');

  const modal = document.getElementById('productModal');
  modal.innerHTML = `
    <div class="pm-overlay" onclick="closeProductModal()"></div>
    <div class="pm-box">
      <button class="pm-close" onclick="closeProductModal()">✕</button>
      <div class="pm-layout">

        <div class="pm-image">
          ${imgSrc
            ? `<img src="${imgSrc}" alt="${p.name}" onerror="this.style.display='none'">`
            : `<div class="pm-placeholder ${getCatColor(p.category)}">${getCatEmoji(p.category)}</div>`
          }
          ${p.oldPrice ? `<span class="pm-discount-badge">−${Math.round((1 - p.price/p.oldPrice)*100)}%</span>` : ''}
        </div>

        <div class="pm-info">
          <div class="pm-category">${p.category}</div>
          <h2 class="pm-name">${p.name}</h2>
          <div class="pm-stars">${starsStr}</div>
          <div class="pm-price-row">
            <span class="pm-price">${Number(p.price).toLocaleString('ru')} сум</span>
            ${p.oldPrice ? `<span class="pm-price-old">${Number(p.oldPrice).toLocaleString('ru')} сум</span>` : ''}
          </div>
          <p class="pm-desc">${p.description || ''}</p>

          ${(p.colors && p.colors.length) ? `
          <div class="pm-section">
            <div class="pm-section-label">Цвет: <span id="selectedColorName">—</span></div>
            <div class="pm-colors">${colorsHtml}</div>
          </div>` : ''}

          ${(p.sizes && p.sizes.length) ? `
          <div class="pm-section">
            <div class="pm-section-label">Размер: <span id="selectedSizeName">—</span></div>
            <div class="pm-sizes">${sizesHtml}</div>
            <a href="#" class="pm-size-guide" onclick="showToast('Таблица размеров — добавь свою');return false;">Таблица размеров →</a>
          </div>` : ''}

          <div class="pm-qty-row">
            <div class="pm-qty">
              <button onclick="changeQty(-1)">−</button>
              <span id="pmQty">1</span>
              <button onclick="changeQty(1)">+</button>
            </div>
            <span class="pm-total" id="pmTotal">${Number(p.price).toLocaleString('ru')} сум</span>
          </div>

          <button class="pm-add-btn" onclick="addToCartFromModal(${p.id})">
            В корзину
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </button>

          <button class="pm-wish-btn" onclick="addToWishlist(${p.id});closeProductModal()">♡ В избранное</button>
        </div>
      </div>
    </div>`;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Автовыбор первого цвета и размера
  const firstColor = modal.querySelector('.picker-color');
  if (firstColor) selectColor(firstColor, p.colors[0]);
  const firstSize = modal.querySelector('.picker-size');
  if (firstSize) selectSize(firstSize, p.sizes[0]);
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  selectedSize = null;
  selectedColor = null;
}

// Выбор размера
function selectSize(btn, size) {
  document.querySelectorAll('.picker-size').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedSize = size;
  const el = document.getElementById('selectedSizeName');
  if (el) el.textContent = size;
}

// Выбор цвета
const colorNames = {
  '#1a1a1a':'Чёрный', '#ffffff':'Белый', '#f5f0e8':'Молочный',
  '#c9a96e':'Золотой', '#8a7560':'Бежевый', '#8b4513':'Коричневый',
  '#2d2d2d':'Тёмно-серый', '#4a3728':'Шоколадный', '#8b1a1a':'Бордовый',
  '#2c3e6b':'Тёмно-синий', '#5c4a3a':'Кофейный', '#4a1a4a':'Сливовый',
};

function selectColor(btn, color) {
  document.querySelectorAll('.picker-color').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedColor = color;
  const el = document.getElementById('selectedColorName');
  if (el) el.textContent = colorNames[color] || color;
}

// Количество
let pmQty = 1;
function changeQty(delta) {
  pmQty = Math.max(1, Math.min(10, pmQty + delta));
  const qtyEl = document.getElementById('pmQty');
  const totalEl = document.getElementById('pmTotal');
  if (qtyEl) qtyEl.textContent = pmQty;
  const modal = document.getElementById('productModal');
  if (totalEl && modal) {
    const id = parseInt(modal.querySelector('.pm-add-btn').getAttribute('onclick').match(/\d+/)[0]);
    const p = products.find(x => x.id === id);
    if (p) totalEl.textContent = (p.price * pmQty).toLocaleString('ru') + ' сум';
  }
}

// Добавить в корзину из модала
function addToCartFromModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  if (p.sizes && p.sizes.length && !selectedSize) {
    showToast('⚠️ Выберите размер');
    document.querySelectorAll('.picker-size')[0]?.closest('.pm-section')?.classList.add('pm-shake');
    setTimeout(() => document.querySelectorAll('.picker-size')[0]?.closest('.pm-section')?.classList.remove('pm-shake'), 500);
    return;
  }

  // Уникальный ключ: товар + размер + цвет
  const cartKey = `${id}_${selectedSize || 'one'}_${selectedColor || 'default'}`;
  const existing = cart.find(i => i.cartKey === cartKey);

  if (existing) {
    existing.qty += pmQty;
  } else {
    cart.push({
      ...p,
      cartKey,
      qty: pmQty,
      selectedSize: selectedSize || null,
      selectedColor: selectedColor || null,
    });
  }

  pmQty = 1;
  updateCart();
  closeProductModal();
  openCart();
  showToast(`"${p.name}" добавлен в корзину`);
}

// =========================================
// КОРЗИНА
// =========================================
function addToCart(id) {
  // Открываем модал вместо прямого добавления
  openProductModal(id);
}

function removeFromCart(key) {
  cart = cart.filter(i => i.cartKey !== key);
  updateCart();
}

function updateCart() {
  const badge = document.getElementById('cartBadge');
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  const total = document.getElementById('cartTotal');
  const count = cart.reduce((s, i) => s + i.qty, 0);
  if (badge) badge.textContent = count;
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛍️</div><div class="cart-empty-text">Корзина пуста</div><div style="font-size:13px;color:var(--clr-muted);margin-top:8px">Добавьте товары из каталога</div></div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  body.innerHTML = cart.map(i => {
    const imgSrc = i.imageData || i.image;
    const imgBlock = imgSrc
      ? `<img src="${imgSrc}" style="width:72px;height:88px;object-fit:cover;border-radius:4px;flex-shrink:0" alt="${i.name}" onerror="this.style.display='none'">`
      : `<div class="cart-item-img ${getCatColor(i.category)}" style="flex-shrink:0">${getCatEmoji(i.category)}</div>`;

    const colorDot = i.selectedColor
      ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${i.selectedColor};border:1px solid rgba(255,255,255,0.3);margin-right:4px;vertical-align:middle"></span>`
      : '';
    const meta = [
      i.selectedSize ? `Размер: ${i.selectedSize}` : '',
      i.selectedColor ? `${colorDot}${colorNames[i.selectedColor] || ''}` : '',
      `${i.qty} шт.`
    ].filter(Boolean).join(' · ');

    return `
      <div class="cart-item">
        ${imgBlock}
        <div style="flex:1;min-width:0">
          <div class="cart-item-name">${i.name}</div>
          <div class="cart-item-meta">${meta}</div>
          <div class="cart-item-qty-row">
            <button class="cart-qty-btn" onclick="changeCartQty('${i.cartKey}', -1)">−</button>
            <span class="cart-qty-num">${i.qty}</span>
            <button class="cart-qty-btn" onclick="changeCartQty('${i.cartKey}', 1)">+</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0">
          <div class="cart-item-price">${(Number(i.price) * i.qty).toLocaleString('ru')} сум</div>
          <button class="cart-item-remove" onclick="removeFromCart('${i.cartKey}')">✕</button>
        </div>
      </div>`;
  }).join('');

  const totalNum = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (total) total.textContent = totalNum.toLocaleString('ru') + ' сум';
  if (footer) footer.style.display = 'block';
}

function changeCartQty(key, delta) {
  const item = cart.find(i => i.cartKey === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  updateCart();
}

function openCart() {
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartDrawer')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.body.style.overflow = '';
}

// =========================================
// ВСПОМОГАТЕЛЬНЫЕ
// =========================================
function getCatEmoji(cat) {
  const map = {'Платья':'👗','Жакеты':'🧥','Брюки':'👖','Трикотаж':'🧶','Джинсы':'👕','Топы':'👚','Верхняя':'🧣','Юбки':'👘','Обувь':'👟','Аксессуары':'👒'};
  return map[cat] || '👕';
}
function getCatColor(cat) {
  const map = {'Платья':'cp-1','Жакеты':'cp-2','Брюки':'cp-3','Трикотаж':'cp-4','Джинсы':'cp-5','Топы':'cp-1','Верхняя':'cp-2','Юбки':'cp-3'};
  return map[cat] || 'cp-1';
}

function openMobileMenu() { document.getElementById('mobileMenu')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeMobileMenu() { document.getElementById('mobileMenu')?.classList.remove('open'); document.body.style.overflow=''; }

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast';
    t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--clr-accent);color:var(--clr-bg);padding:12px 24px;border-radius:100px;font-size:13px;font-weight:500;z-index:9998;opacity:0;transition:all 0.3s;white-space:nowrap;pointer-events:none;`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; }, 2500);
}

function addToWishlist(id) { showToast('Добавлено в избранное ♡'); }
function quickView(id) { openProductModal(id); }

function startCountdown() {
  const end = new Date(Date.now() + (12*3600+34*60+56)*1000);
  setInterval(() => {
    const diff = end - new Date(); if (diff<=0) return;
    const pad = n => String(Math.floor(n)).padStart(2,'0');
    const hEl=document.getElementById('c1-h'), mEl=document.getElementById('c1-m'), sEl=document.getElementById('c1-s');
    if(hEl) hEl.textContent=pad(diff/3600000);
    if(mEl) mEl.textContent=pad((diff%3600000)/60000);
    if(sEl) sEl.textContent=pad((diff%60000)/1000);
  }, 1000);
}

function subscribeNewsletter() { showToast('🎉 Подписка оформлена! Скидка 10% уже у вас.'); }

function observeFadeUp() {
  const els = document.querySelectorAll('.fade-up:not(.visible)');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e,i) => { if(e.isIntersecting){ setTimeout(()=>e.target.classList.add('visible'),i*80); obs.unobserve(e.target); } });
  }, { threshold:0.08 });
  els.forEach(el => obs.observe(el));
}

window.addEventListener('scroll', () => {
  document.getElementById('scrollTop')?.classList.toggle('visible', window.scrollY > 400);
});

document.addEventListener('keydown', e => { if(e.key==='Escape') closeProductModal(); });

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  startCountdown();
  observeFadeUp();
});


function openCheckout() {
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s,i) => s + i.qty, 0);
  
  document.getElementById('checkoutContent').innerHTML = buildCheckoutForm(total, count);
  document.getElementById('checkoutOverlay').style.display = 'block';
  document.getElementById('checkoutDrawer').style.display = 'block';
  document.body.style.overflow = 'hidden';
  closeCart();
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').style.display = 'none';
  document.getElementById('checkoutDrawer').style.display = 'none';
  document.body.style.overflow = '';
}




function buildCheckoutForm(total, count) {
  const method = 'click'; // по умолчанию
  return `
    <h2 style="font-family:var(--font-display);font-weight:300;margin:0 0 20px">Оформление заказа</h2>
    
    <p style="font-size:13px;color:var(--clr-muted);margin:0 0 4px">Итого</p>
    <p style="font-size:24px;font-weight:500;margin:0 0 20px">${total.toLocaleString('ru')} сум</p>
    <p style="font-size:12px;color:var(--clr-muted);margin:-16px 0 20px">${count} товаров · Доставка бесплатно</p>

    <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--clr-muted);margin:0 0 10px">Способ оплаты</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
      <label style="cursor:pointer;border:2px solid #00AAFF;border-radius:8px;padding:14px;text-align:center;background:rgba(0,170,255,0.05)">
        <input type="radio" name="pay" value="click" checked style="display:none">
        <div style="font-weight:500;color:#00AAFF">Click</div>
        <div style="font-size:11px;color:var(--clr-muted)">Мгновенно</div>
      </label>
      <label style="cursor:pointer;border:0.5px solid var(--clr-border);border-radius:8px;padding:14px;text-align:center">
        <input type="radio" name="pay" value="payme" style="display:none">
        <div style="font-weight:500;color:#00BFFF">Payme</div>
        <div style="font-size:11px;color:var(--clr-muted)">Мгновенно</div>
      </label>
    </div>

    <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--clr-muted);margin:0 0 10px">Контакты</p>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
      <input type="text" id="co-name" placeholder="Имя и фамилия" 
        style="width:100%;box-sizing:border-box;padding:10px 14px;background:var(--clr-card);
        border:1px solid var(--clr-border);border-radius:6px;color:var(--clr-text);font-family:inherit;font-size:13px">
      <input type="tel" id="co-phone" placeholder="+998 __ ___ __ __"
        style="width:100%;box-sizing:border-box;padding:10px 14px;background:var(--clr-card);
        border:1px solid var(--clr-border);border-radius:6px;color:var(--clr-text);font-family:inherit;font-size:13px"
        oninput="coFormatPhone(this)">
      <input type="text" id="co-addr" placeholder="Адрес доставки"
        style="width:100%;box-sizing:border-box;padding:10px 14px;background:var(--clr-card);
        border:1px solid var(--clr-border);border-radius:6px;color:var(--clr-text);font-family:inherit;font-size:13px">
    </div>

    <div style="background:var(--clr-card);border-radius:6px;padding:10px 14px;margin-bottom:20px;
      font-size:12px;color:var(--clr-muted);display:flex;align-items:center;gap:8px">
      🔒 Платёж защищён SSL. Данные карты не хранятся на нашем сервере.
    </div>

    <button onclick="submitCheckout(${total})" 
      style="width:100%;padding:14px;background:var(--clr-accent);border:none;border-radius:8px;
      color:var(--clr-bg);font-family:inherit;font-size:15px;font-weight:500;cursor:pointer" id="co-btn">
      Оплатить ${total.toLocaleString('ru')} сум →
    </button>`;
}

function coFormatPhone(inp) {
  let v = inp.value.replace(/\D/g,'');
  if (v.startsWith('998')) v = v.slice(3);
  v = v.slice(0,9);
  let r = '+998';
  if (v.length > 0) r += ' ' + v.slice(0,2);
  if (v.length > 2) r += ' ' + v.slice(2,5);
  if (v.length > 5) r += ' ' + v.slice(5,7);
  if (v.length > 7) r += ' ' + v.slice(7,9);
  inp.value = r;
}

function submitCheckout(total) {
  const name = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.replace(/\D/g,'');
  const addr = document.getElementById('co-addr').value.trim();
  const method = document.querySelector('input[name=pay]:checked')?.value;

  if (!name) { showToast('⚠️ Введите имя'); return; }
  if (phone.length < 12) { showToast('⚠️ Введите телефон'); return; }
  if (!addr) { showToast('⚠️ Введите адрес'); return; }

  const btn = document.getElementById('co-btn');
  btn.textContent = 'Создаём заказ...';
  btn.disabled = true;

  // Здесь отправляете заказ на свой бэкенд:
  // fetch('/api/order', { method:'POST', body: JSON.stringify({ name, phone, addr, method, total, cart }) })
  //   .then(r => r.json())
  //   .then(data => window.location.href = data.paymentUrl) // редирект на Click/Payme

  async function submitCheckout(total) {
  const name = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const addr = document.getElementById('co-addr').value.trim();
  const method = document.querySelector('input[name=pay]:checked')?.value;

  if (!name) { showToast('⚠️ Введите имя'); return; }
  if (phone.replace(/\D/g,'').length < 12) { showToast('⚠️ Введите телефон'); return; }
  if (!addr) { showToast('⚠️ Введите адрес'); return; }

  const btn = document.getElementById('co-btn');
  btn.textContent = 'Оформляем заказ...';
  btn.disabled = true;

  const order = {
    id: Math.floor(Math.random() * 90000 + 10000),
    date: new Date().toISOString(),
    name,
    phone,
    addr,
    method,
    total,
    status: 'new',
    items: cart.map(i => ({
      name: i.name,
      category: i.category,
      price: i.price,
      qty: i.qty,
      selectedSize: i.selectedSize || null,
      selectedColor: i.selectedColor || null,
      imageData: i.imageData || null,
    }))
  };

  try {
    await saveOrder(order); // → localStorage + Telegram + Sheets

    // Очищаем корзину
    cart = [];
    updateCart();

    // Показываем успех
    document.getElementById('checkoutContent').innerHTML = `
      <div style="text-align:center;padding:40px 20px">
        <div style="width:56px;height:56px;border-radius:50%;
          background:rgba(201,169,110,0.15);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 16px;font-size:28px">✓</div>
        <h3 style="font-family:var(--font-display);font-weight:300;
          margin:0 0 8px;font-size:1.4rem">Заказ принят!</h3>
        <p style="color:var(--clr-muted);font-size:13px;margin:0 0 4px">
          Заказ #${order.id}</p>
        <p style="color:var(--clr-muted);font-size:13px;margin:0 0 24px">
          Мы свяжемся с вами по номеру ${phone}</p>
        <button onclick="closeCheckout()"
          style="padding:12px 32px;background:var(--clr-accent);
          border:none;border-radius:8px;color:var(--clr-bg);
          font-family:inherit;font-size:14px;cursor:pointer">
          Отлично!
        </button>
      </div>`;

  } catch (err) {
    btn.textContent = 'Ошибка, попробуйте снова';
    btn.disabled = false;
    showToast('⚠️ Ошибка при оформлении заказа');
  }
}
}