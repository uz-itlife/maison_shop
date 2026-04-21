
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
    return null; // таймаут или ошибка — не блокируем заказ
  } finally {
    clearTimeout(timer);
  }
}

// ==========================================
// ОТПРАВКА В TELEGRAM
// ==========================================
async function sendToTelegram(order) {
  const statusEmoji = {
    click: '💙 Click',
    payme: '💙 Payme',
    cash: '💵 Наличные'
  };

  const text = `
🛍 <b>Новый заказ #${order.id}</b>

👤 <b>Покупатель:</b> ${order.name}
📞 <b>Телефон:</b> ${order.phone}
📍 <b>Адрес:</b> ${order.addr}
💳 <b>Оплата:</b> ${statusEmoji[order.method] || order.method}

🧾 <b>Товары:</b>
${order.items.map(i =>
  `• ${i.name}${i.selectedSize ? ` (${i.selectedSize})` : ''} × ${i.qty} шт. = ${(i.price * i.qty).toLocaleString('ru')} сум`
).join('\n')}

💰 <b>Итого: ${Number(order.total).toLocaleString('ru')} сум</b>
🕐 ${new Date(order.date).toLocaleString('ru')}
  `.trim();

  await fetchWithTimeout(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML'
      })
    },
    5000
  );
}

// ==========================================
// ОТПРАВКА В GOOGLE SHEETS
// ==========================================
async function sendToSheets(order) {
  await fetchWithTimeout(
    GOOGLE_SCRIPT_URL,
    {
      method: 'POST',
      body: JSON.stringify({
        id: order.id,
        date: new Date(order.date).toLocaleString('ru'),
        name: order.name,
        phone: order.phone,
        addr: order.addr,
        method: order.method,
        total: order.total,
        items: order.items
      })
    },
    5000
  );
}

// ==========================================
// СОХРАНЕНИЕ В LOCALSTORAGE
// ==========================================
function saveToLocalStorage(order) {
  const orders = JSON.parse(localStorage.getItem('maison_orders') || '[]');
  orders.unshift(order);
  localStorage.setItem('maison_orders', JSON.stringify(orders));
}

// ==========================================
// ГЛАВНАЯ ФУНКЦИЯ — вызывается при заказе
// ==========================================
async function saveOrder(order) {
  // 1. Сохраняем локально СРАЗУ — это быстро
  saveToLocalStorage(order);

  // 2. Отправляем в Telegram и Sheets В ФОНЕ — не блокируем UI
  Promise.all([
    sendToTelegram(order),
    sendToSheets(order)
  ]).catch(err => console.error('Фоновая отправка:', err));
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
  const name = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const addr = document.getElementById('co-addr').value.trim();
  const method = document.querySelector('input[name=pay]:checked')?.value;

  if (!name) { showToast('⚠️ Введите имя'); return; }
  if (phone.replace(/\D/g, '').length < 12) { showToast('⚠️ Введите телефон'); return; }
  if (!addr) { showToast('⚠️ Введите адрес'); return; }

  const btn = document.getElementById('co-btn');
  btn.textContent = 'Оформляем...';
  btn.disabled = true;

  const order = {
    id: Math.floor(Math.random() * 90000 + 10000),
    date: new Date().toISOString(),
    name, phone, addr, method, total,
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

  // 1. Сохраняем локально СРАЗУ
  saveToLocalStorage(order);

  // 2. Очищаем корзину СРАЗУ
  cart = [];
  updateCart();

  // 3. Показываем успех СРАЗУ — не ждём Telegram/Sheets
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

  // 4. Отправляем в фоне — не блокируем UI
  Promise.all([
    sendToTelegram(order),
    sendToSheets(order)
  ]).catch(err => console.error('Фоновая отправка:', err));
}

// ==========================================
// МОДАЛ ОФОРМЛЕНИЯ ЗАКАЗА
// ==========================================
function openCheckout() {
  if (!cart.length) { showToast('Корзина пуста'); return; }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
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
