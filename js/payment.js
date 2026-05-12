// ==========================================
// КОНФИГ — fallback для локальной разработки


let _cfg = null;

async function getConfig() {
  if (_cfg) return _cfg;
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      _cfg = await res.json();
      return _cfg;
    }
  } catch {}

  // Берём в момент вызова — к этому времени config.local.js уже загружен
  _cfg = window.LOCAL_CONFIG || { tgToken: '', tgChat: '', sheetsUrl: '' };
  return _cfg;
}
// ==========================================
// ЗАПРОС С ТАЙМАУТОМ — не зависает
// ==========================================
async function fetchWithTimeout(url, options, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ==========================================
// ОТПРАВКА В TELEGRAM
// ==========================================
async function sendToTelegram(order) {
  const cfg = await getConfig();
  if (!cfg.tgToken || !cfg.tgChat) {
    console.warn('⚠️ Telegram не настроен');
    return;
  }

  const items = order.items
    .map(i =>
      `• ${i.name}${i.selectedSize ? ' / ' + i.selectedSize : ''} × ${i.qty} шт. = ${(i.price * i.qty).toLocaleString('ru')} сум`
    )
    .join('\n');

  const text =
    `🛍 <b>Новый заказ #${order.id}</b>\n\n` +
    `👤 <b>Покупатель:</b> ${order.name}\n` +
    `📞 <b>Телефон:</b> ${order.phone}\n` +
    `📍 <b>Адрес:</b> ${order.addr}\n` +
    `💳 <b>Оплата:</b> ${order.method === 'click' ? 'Click' : 'Payme'}\n\n` +
    `📋 <b>Товары:</b>\n${items}\n\n` +
    `💰 <b>Итого: ${order.total.toLocaleString('ru')} сум</b>\n` +
    `🕐 ${order.date}`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.tgToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: cfg.tgChat, text, parse_mode: 'HTML' })
      }
    );
    const data = await res.json();
    if (data.ok) console.log('✅ Telegram OK');
    else console.error('❌ Telegram:', data.description);
  } catch (err) {
    console.error('❌ Telegram error:', err);
  }
}

// ==========================================
// ОТПРАВКА В GOOGLE SHEETS
// ==========================================
async function sendToSheets(order) {
  const cfg = await getConfig();
  if (!cfg.sheetsUrl) {
    console.warn('⚠️ Google Sheets не настроен');
    return;
  }

  try {
    await fetch(cfg.sheetsUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:     order.id,
        date: order.date,
        name:   order.name,
        phone:  order.phone,
        addr:   order.addr,
        method: order.method,
        total:  order.total,
        items:  order.items.map(i => `${i.name} x${i.qty}`).join(', ')
      })
    });
    console.log('✅ Sheets OK');
  } catch (err) {
    console.error('❌ Sheets error:', err);
  }
}

// ==========================================
// СОХРАНЕНИЕ В LOCALSTORAGE
// ==========================================
function saveToLocalStorage(order) {
  try {
    const orders = JSON.parse(localStorage.getItem('maison_orders') || '[]');

    // Убираем imageData из товаров — экономим место
    const orderToSave = {
      ...order,
      items: order.items.map(i => {
        const { imageData, ...rest } = i;
        return rest;
      })
    };

    orders.unshift(orderToSave);

    // Храним максимум 20 последних заказов
    if (orders.length > 20) orders.splice(20);

    localStorage.setItem('maison_orders', JSON.stringify(orders));
  } catch (e) {
    console.warn('saveToLocalStorage: localStorage переполнен, очищаем старые заказы');
    try {
      // Аварийная очистка — оставляем только текущий заказ
      localStorage.setItem('maison_orders', JSON.stringify([order]));
    } catch (e2) {
      localStorage.removeItem('maison_orders');
    }
  }
}
// ==========================================
// ГЛАВНАЯ ФУНКЦИЯ — вызывается при заказе
// ==========================================
async function saveOrder(order) {
  saveToLocalStorage(order);
  sendToTelegram(order);
  sendToSheets(order);
}

// ==========================================
// ФОРМА ОФОРМЛЕНИЯ ЗАКАЗА
// ==========================================
function buildCheckoutForm(total, count) {
  return `
    <h2 style="font-family:var(--font-display);font-weight:300;margin:0 0 20px">
      Оформление заказа
    </h2>

    <p style="font-size:13px;color:var(--clr-muted);margin:0 0 4px">Итого</p>
    <p style="font-size:24px;font-weight:500;margin:0 0 4px">
      ${total.toLocaleString('ru')} сум
    </p>
    <p style="font-size:12px;color:var(--clr-muted);margin:0 0 20px">
      ${count} товаров · Доставка бесплатно
    </p>

    <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;
      color:var(--clr-muted);margin:0 0 10px">Способ оплаты</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
      <label id="lbl-click" style="cursor:pointer;border:2px solid #00AAFF;
        border-radius:8px;padding:14px;text-align:center;
        background:rgba(0,170,255,0.05)">
        <input type="radio" name="pay" value="click" checked style="display:none"
          onchange="selectPayMethod('click')">
        <div style="font-weight:500;color:#00AAFF;font-size:15px">Click</div>
        <div style="font-size:11px;color:var(--clr-muted)">Мгновенно</div>
      </label>
      <label id="lbl-payme" style="cursor:pointer;
        border:0.5px solid var(--clr-border);
        border-radius:8px;padding:14px;text-align:center">
        <input type="radio" name="pay" value="payme" style="display:none"
          onchange="selectPayMethod('payme')">
        <div style="font-weight:500;color:#00BFFF;font-size:15px">Payme</div>
        <div style="font-size:11px;color:var(--clr-muted)">Мгновенно</div>
      </label>
    </div>

    <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;
      color:var(--clr-muted);margin:0 0 10px">Контактные данные</p>

    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
      <input type="text" id="co-name" placeholder="Имя и фамилия"
        style="width:100%;box-sizing:border-box;padding:10px 14px;
        background:var(--clr-card);border:1px solid var(--clr-border);
        border-radius:6px;color:var(--clr-text);font-family:inherit;font-size:13px;outline:none">
      <input type="tel" id="co-phone" placeholder="+998 __ ___ __ __"
        style="width:100%;box-sizing:border-box;padding:10px 14px;
        background:var(--clr-card);border:1px solid var(--clr-border);
        border-radius:6px;color:var(--clr-text);font-family:inherit;font-size:13px;outline:none"
        oninput="coFormatPhone(this)">
      <input type="text" id="co-addr" placeholder="Адрес доставки"
        style="width:100%;box-sizing:border-box;padding:10px 14px;
        background:var(--clr-card);border:1px solid var(--clr-border);
        border-radius:6px;color:var(--clr-text);font-family:inherit;font-size:13px;outline:none">
    </div>

    <div style="background:var(--clr-card);border-radius:6px;padding:10px 14px;
      margin-bottom:20px;font-size:12px;color:var(--clr-muted);
      display:flex;align-items:center;gap:8px">
      🔒 Платёж защищён SSL. Данные карты не хранятся на нашем сервере.
    </div>

    <button onclick="submitCheckout(${total})" id="co-btn"
      style="width:100%;padding:14px;background:var(--clr-accent);border:none;
      border-radius:8px;color:var(--clr-bg);font-family:inherit;
      font-size:15px;font-weight:500;cursor:pointer">
      Оплатить ${total.toLocaleString('ru')} сум →
    </button>`;
}

function selectPayMethod(m) {
  const lc = document.getElementById('lbl-click');
  const lp = document.getElementById('lbl-payme');
  if (m === 'click') {
    lc.style.border = '2px solid #00AAFF';
    lc.style.background = 'rgba(0,170,255,0.05)';
    lp.style.border = '0.5px solid var(--clr-border)';
    lp.style.background = 'transparent';
  } else {
    lp.style.border = '2px solid #00BFFF';
    lp.style.background = 'rgba(0,191,255,0.05)';
    lc.style.border = '0.5px solid var(--clr-border)';
    lc.style.background = 'transparent';
  }
}

function coFormatPhone(inp) {
  let v = inp.value.replace(/\D/g, '');
  if (v.startsWith('998')) v = v.slice(3);
  v = v.slice(0, 9);
  let r = '+998';
  if (v.length > 0) r += ' ' + v.slice(0, 2);
  if (v.length > 2) r += ' ' + v.slice(2, 5);
  if (v.length > 5) r += ' ' + v.slice(5, 7);
  if (v.length > 7) r += ' ' + v.slice(7, 9);
  inp.value = r;
}

async function submitCheckout(total) {
  const name   = document.getElementById('co-name').value.trim();
  const phone  = document.getElementById('co-phone').value.trim();
  const addr   = document.getElementById('co-addr').value.trim();
  const method = document.querySelector('input[name=pay]:checked')?.value;

  if (!name)  { showToast('⚠️ Введите имя');     return; }
  if (phone.replace(/\D/g, '').length < 12) { showToast('⚠️ Введите телефон'); return; }
  if (!addr)  { showToast('⚠️ Введите адрес');   return; }

  const btn = document.getElementById('co-btn');
  btn.textContent = 'Оформляем...';
  btn.disabled = true;

  const order = {
    id:     Math.floor(Math.random() * 90000 + 10000),
    date: new Date().toLocaleString('ru-UZ', { timeZone: 'Asia/Tashkent' }),
    name, phone, addr, method, total,
    status: 'new',
    items: cart.map(i => ({
      name:          i.name,
      category:      i.category,
      price:         i.price,
      qty:           i.qty,
      selectedSize:  i.selectedSize  || null,
      selectedColor: i.selectedColor || null,
      imageData:     i.imageData     || null,
    }))
  };

  // 1. Сохраняем локально СРАЗУ
  saveToLocalStorage(order);

  // 2. Очищаем корзину СРАЗУ
  cart = [];
  updateCart();
  saveCart(); // сохраняем пустую корзину в localStorage

  // 3. Показываем успех СРАЗУ
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

  // 4. Отправляем в Telegram и Google Sheets в фоне
  sendToTelegram(order);
  sendToSheets(order);
}

// ==========================================
// ОТКРЫТИЕ / ЗАКРЫТИЕ ОФОРМЛЕНИЯ ЗАКАЗА
// ==========================================
function openCheckout() {
  if (!cart.length) { showToast('Корзина пуста'); return; }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('checkoutContent').innerHTML = buildCheckoutForm(total, count);
  document.getElementById('checkoutOverlay').style.display = 'block';
  document.getElementById('checkoutDrawer').style.display  = 'block';
  document.body.style.overflow = 'hidden';
  closeCart();
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').style.display = 'none';
  document.getElementById('checkoutDrawer').style.display  = 'none';
  document.body.style.overflow = '';
}