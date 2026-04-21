// ==========================================
// КАТАЛОГ — фильтры, сортировка, пагинация
// ==========================================
const CAT_PAGE_SIZE = 12;
let catPage = 1;
let allProducts = [];
let displayProducts = [];

// Состояние фильтров
let activeCategories = new Set();
let activeBadges = new Set();
let activeColors = new Set();
let MAX_PRICE = 2000000;
let priceMinFilter = 0;
let priceMaxFilter = MAX_PRICE;

// Ждём загрузки товаров
function onProductsLoaded(prods) {
  allProducts = prods;
  MAX_PRICE = Math.max(...prods.map(p => p.price), 2000000);
  priceMaxFilter = MAX_PRICE;        // ← исправлено
  priceMinFilter = 0;

  buildFilters();
  applyFilters();

  const sub = document.getElementById('pageSubtitle');
  if (sub) sub.textContent = `${prods.length} товаров в каталоге`;
}

async function initCatalog() {
  const stored = localStorage.getItem('maison_products');
  const images = JSON.parse(localStorage.getItem('maison_images') || '{}');

  if (stored) {
    let prods = JSON.parse(stored);
    prods = prods.map(p => ({ ...p, imageData: images[p.id] || null }));
    onProductsLoaded(prods);
    return;
  }

  try {
    const res = await fetch('data/products.json');
    if (res.ok) {
      onProductsLoaded(await res.json());
    } else {
      throw new Error();
    }
  } catch {
    window.addEventListener('load', () => {
      if (typeof products !== 'undefined' && products.length) {
        onProductsLoaded(products);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initCatalog);

// ---- СТРОИМ ФИЛЬТРЫ ----
function buildFilters() {
  const categories = [...new Set(allProducts.map(p => p.category))].sort();
  const allColors = [...new Set(allProducts.flatMap(p => p.colors || []))];
  const colorNames = {
    '#1a1a1a':'Чёрный','#ffffff':'Белый','#f5f0e8':'Молочный',
    '#c9a96e':'Золотой','#8a7560':'Бежевый','#8b4513':'Коричневый',
    '#2d2d2d':'Тёмно-серый','#4a3728':'Шоколадный','#8b1a1a':'Бордовый',
    '#2c3e6b':'Тёмно-синий','#5c4a3a':'Кофейный','#4a1a4a':'Сливовый',
  };

  const html = `
    <div class="filters-title">
      Фильтры
      <button class="filters-reset" onclick="resetFilters()">Сбросить всё</button>
    </div>

    <div class="filter-group" id="fg-cat">
      <div class="filter-group-title" onclick="toggleGroup('fg-cat')">
        Категория <span class="toggle-icon">▾</span>
      </div>
      <div class="filter-group-body filter-check-list">
        ${categories.map(cat => {
          const cnt = allProducts.filter(p => p.category === cat).length;
          return `<label class="filter-check">
            <input type="checkbox" onchange="toggleCategory('${cat}')">
            <span class="check-box">✓</span>
            ${cat}
            <span class="check-count">${cnt}</span>
          </label>`;
        }).join('')}
      </div>
    </div>

    <div class="filter-group" id="fg-badge">
      <div class="filter-group-title" onclick="toggleGroup('fg-badge')">
        Тег <span class="toggle-icon">▾</span>
      </div>
      <div class="filter-group-body filter-check-list">
        ${[['new','🆕 Новинки'],['sale','💸 Скидки'],['hit','🔥 Хиты']].map(([val,label]) => {
          const cnt = allProducts.filter(p => p.badge === val).length;
          return `<label class="filter-check">
            <input type="checkbox" onchange="toggleBadge('${val}')">
            <span class="check-box">✓</span>
            ${label}
            <span class="check-count">${cnt}</span>
          </label>`;
        }).join('')}
      </div>
    </div>

    <div class="filter-group" id="fg-price">
      <div class="filter-group-title" onclick="toggleGroup('fg-price')">
        Цена <span class="toggle-icon">▾</span>
      </div>
      <div class="filter-group-body price-range-wrap">
        <div class="price-inputs">
          <input type="number" class="price-input price-min" value="0" placeholder="От" oninput="handlePriceInput(this)">
          <span class="price-sep">—</span>
          <input type="number" class="price-input price-max" value="${MAX_PRICE}" placeholder="До" oninput="handlePriceInput(this)">
        </div>
        <input type="range" class="price-slider" min="0" max="${MAX_PRICE}" value="${MAX_PRICE}" step="10000" oninput="handlePriceSlider(this)">
      </div>
    </div>

    ${allColors.length ? `
    <div class="filter-group" id="fg-color">
      <div class="filter-group-title" onclick="toggleGroup('fg-color')">
        Цвет <span class="toggle-icon">▾</span>
      </div>
      <div class="filter-group-body">
        <div class="filter-colors">
          ${allColors.map(c => `
            <button class="filter-color-btn" style="background:${c}" title="${colorNames[c]||c}"
              onclick="toggleColorFilter('${c}',this)"></button>
          `).join('')}
        </div>
      </div>
    </div>` : ''}
  `;

  document.getElementById('filtersContent').innerHTML = html;
  document.getElementById('filterDrawerContent').innerHTML = html;
  syncPriceUI();
}

// ====================== СЛАЙДЕР ЦЕНЫ ======================
function updateSliderBg(slider) {
  const pct = (slider.value / slider.max * 100).toFixed(1);
  slider.style.setProperty('--pct', pct + '%');
}

function syncPriceUI() {
  document.querySelectorAll('.price-min').forEach(input => input.value = priceMinFilter);
  document.querySelectorAll('.price-max').forEach(input => input.value = priceMaxFilter);
  document.querySelectorAll('.price-slider').forEach(slider => {
    slider.value = priceMaxFilter;
    updateSliderBg(slider);
  });
}

function handlePriceInput(input) {
  if (input.classList.contains('price-min')) priceMinFilter = parseInt(input.value) || 0;
  else priceMaxFilter = parseInt(input.value) || MAX_PRICE;
  syncPriceUI();
  applyFilters();
}

function handlePriceSlider(slider) {
  priceMaxFilter = parseInt(slider.value);
  syncPriceUI();
  applyFilters();
}

function toggleGroup(id) {
  document.getElementById(id)?.classList.toggle('collapsed');
}

// ---- ПЕРЕКЛЮЧЕНИЕ ФИЛЬТРОВ ----
function toggleCategory(cat) {
  activeCategories.has(cat) ? activeCategories.delete(cat) : activeCategories.add(cat);
  syncCheckboxes(); applyFilters();
}
function toggleBadge(badge) {
  activeBadges.has(badge) ? activeBadges.delete(badge) : activeBadges.add(badge);
  syncCheckboxes(); applyFilters();
}
function toggleColorFilter(color, btn) {
  if (activeColors.has(color)) { activeColors.delete(color); btn.classList.remove('active'); }
  else { activeColors.add(color); btn.classList.add('active'); }
  applyFilters();
}

function syncCheckboxes() {
  // можно оставить пустым — чекбоксы управляются через onchange
}

function resetFilters() {
  activeCategories.clear();
  activeBadges.clear();
  activeColors.clear();

  document.querySelectorAll('.filter-check input').forEach(cb => cb.checked = false);
  document.querySelectorAll('.filter-color-btn').forEach(b => b.classList.remove('active'));

  priceMinFilter = 0;
  priceMaxFilter = MAX_PRICE;
  syncPriceUI();
  document.getElementById('catalogSearch').value = '';
  applyFilters();
}

// ---- ПРИМЕНИТЬ ФИЛЬТРЫ ----
function applyFilters() {
  const search = document.getElementById('catalogSearch')?.value.toLowerCase().trim() || '';
  const sort = document.getElementById('sortSelect')?.value || 'default';
  const priceMin = priceMinFilter;
  const priceMax = priceMaxFilter;

  const badgeMap = {
    new: ['новинка', 'новинки', 'new'],
    sale: ['скидка', 'скидки', 'sale'],
    hit: ['хит', 'хиты', 'hit'],
  };

  let result = allProducts.filter(p => {
    if (activeCategories.size && !activeCategories.has(p.category)) return false;
    if (activeBadges.size && !activeBadges.has(p.badge)) return false;
    if (activeColors.size && !p.colors?.some(c => activeColors.has(c))) return false;
    if (p.price < priceMin || p.price > priceMax) return false;

    if (search) {
      const badgeWords = badgeMap[p.badge] || [];
      const matchesBadge = badgeWords.some(w => w.includes(search));
      const matchesName = p.name.toLowerCase().includes(search);
      const matchesCategory = p.category.toLowerCase().includes(search);
      const matchesDesc = (p.description || '').toLowerCase().includes(search);
      if (!matchesName && !matchesCategory && !matchesDesc && !matchesBadge) return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'name-asc') return a.name.localeCompare(b.name, 'ru');
    if (sort === 'stars') return b.stars - a.stars;
    if (sort === 'new') return (b.badge === 'new') - (a.badge === 'new');
    if (sort === 'sale') return (b.badge === 'sale') - (a.badge === 'sale');
    return 0;
  });

  displayProducts = result;
  catPage = 1;

  updateActiveTags(search, priceMin, priceMax);
  renderCatalog();
}

// ---- АКТИВНЫЕ ТЕГИ (исправлено удаление цены) ----
function updateActiveTags(search, priceMin, priceMax) {
  const tags = [];
  activeCategories.forEach(c => tags.push({ label: c, remove: () => { activeCategories.delete(c); applyFilters(); } }));
  activeBadges.forEach(b => {
    const labels = { new:'Новинки', sale:'Скидки', hit:'Хиты' };
    tags.push({ label: labels[b] || b, remove: () => { activeBadges.delete(b); applyFilters(); } });
  });
  activeColors.forEach(c => tags.push({ label: '●', color: c, remove: () => { activeColors.delete(c); applyFilters(); } }));

  if (priceMax < MAX_PRICE) {
    tags.push({
      label: `до ${Number(priceMax).toLocaleString('ru')} сум`,
      remove: () => {
        priceMaxFilter = MAX_PRICE;
        syncPriceUI();
        applyFilters();
      }
    });
  }
  if (search) {
    tags.push({
      label: `«${search}»`,
      remove: () => {
        document.getElementById('catalogSearch').value = '';
        applyFilters();
      }
    });
  }

  const container = document.getElementById('activeTags');
  container.innerHTML = tags.map((t, i) => `
    <span class="active-filter-tag" onclick="tags${i}remove()">
      ${t.color ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${t.color}"></span>` : ''}
      ${t.label}
      <span class="rm">✕</span>
    </span>`).join('');

  tags.forEach((t, i) => { window[`tags${i}remove`] = t.remove; });
}

// ---- РЕНДЕР И ПАГИНАЦИЯ ----
function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  const info = document.getElementById('resultsInfo');
  const total = displayProducts.length;

  if (info) info.innerHTML = `Найдено: <span>${total}</span> товаров`;

  const sub = document.getElementById('pageSubtitle');
  if (sub) sub.textContent = `${allProducts.length} товаров в каталоге`;

  const page = displayProducts.slice(0, catPage * CAT_PAGE_SIZE);

  if (!page.length) {
    grid.innerHTML = `
      <div class="empty-catalog">
        <div class="empty-catalog-icon">🔍</div>
        <div class="empty-catalog-text">Товары не найдены</div>
        <div class="empty-catalog-sub">Попробуй изменить фильтры или поисковый запрос</div>
        <button class="btn btn-outline" style="margin-top:20px" onclick="resetFilters()">Сбросить фильтры</button>
      </div>`;
    document.getElementById('loadMoreBtn').style.display = 'none';
    return;
  }

  grid.innerHTML = page.map(p => buildCard(p)).join('');
  observeFadeUp();

  const remaining = total - page.length;
  const btn = document.getElementById('loadMoreBtn');
  if (remaining > 0) {
    btn.style.display = 'inline-flex';
    btn.textContent = `Загрузить ещё (${remaining})`;
  } else {
    btn.style.display = 'none';
  }
}

function catalogLoadMore() {
  catPage++;
  const grid = document.getElementById('catalogGrid');
  const page = displayProducts.slice(0, catPage * CAT_PAGE_SIZE);
  grid.innerHTML = page.map(p => buildCard(p)).join('');
  observeFadeUp();

  const remaining = displayProducts.length - page.length;
  const btn = document.getElementById('loadMoreBtn');
  if (remaining > 0) {
    btn.style.display = 'inline-flex';
    btn.textContent = `Загрузить ещё (${remaining})`;
  } else {
    btn.style.display = 'none';
  }
}

function buildCard(p) {
  const imgSrc = p.imageData || p.image;
  const badgeClass = { new:'badge-new', sale:'badge-sale', hit:'badge-hit' }[p.badge] || 'badge-new';
  const badgeLabel = { new:'Новинка', sale:'Скидка', hit:'Хит' }[p.badge] || p.badge;
  const starsStr = '★'.repeat(p.stars) + '☆'.repeat(5 - p.stars);
  const catEmoji = getCatEmoji ? getCatEmoji(p.category) : '📦';
  const catColor = getCatColor ? getCatColor(p.category) : '';

  const imageBlock = imgSrc
    ? `<img src="${imgSrc}" alt="${p.name}" class="product-real-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';

  return `
    <div class="product-card fade-up" data-id="${p.id}">
      <div class="product-image-wrap">
        ${imageBlock}
        <div class="product-placeholder ${catColor}" style="${imgSrc ? 'display:none' : ''}">${catEmoji}</div>
        <span class="product-badge ${badgeClass}">${badgeLabel}</span>
        <div class="product-actions">
          <button class="product-action-btn" onclick="addToWishlist(${p.id})">♡</button>
          <button class="product-action-btn" onclick="openProductModal(${p.id})">👁</button>
        </div>
        ${(p.sizes?.length) ? `<div class="product-sizes-hover">${p.sizes.map(s=>`<span class="size-tag">${s}</span>`).join('')}</div>` : ''}
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
}

function setView(mode) {
  const grid = document.getElementById('catalogGrid');
  document.getElementById('viewGrid').classList.toggle('active', mode === 'grid');
  document.getElementById('viewList').classList.toggle('active', mode === 'list');
  grid.classList.toggle('view-list', mode === 'list');
}

function openFilterDrawer() {
  document.getElementById('filterDrawer').classList.add('open');
  document.getElementById('filterOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeFilterDrawer() {
  document.getElementById('filterDrawer').classList.remove('open');
  document.getElementById('filterOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

window.addEventListener('scroll', () => {
  document.getElementById('scrollTop')?.classList.toggle('visible', window.scrollY > 400);
});

function observeFadeUp() {
  const els = document.querySelectorAll('.fade-up:not(.visible)');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 60);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.06 });
  els.forEach(el => obs.observe(el));
}