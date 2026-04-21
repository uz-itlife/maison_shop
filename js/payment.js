// ==========================================
// НАСТРОЙКИ — вставьте свои данные
// ==========================================
const TELEGRAM_TOKEN = 'ВАШ_ТОКЕН_ОТ_BOTFATHER';
const TELEGRAM_CHAT_ID = 'ВАШ_CHAT_ID';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/АБВ.../exec';

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

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML'
      })
    });
  } catch (err) {
    console.error('Telegram error:', err);
  }
}

// ==========================================
// ОТПРАВКА В GOOGLE SHEETS
// ==========================================
async function sendToSheets(order) {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
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
    });
  } catch (err) {
    console.error('Sheets error:', err);
  }
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
  // Сохраняем везде одновременно
  saveToLocalStorage(order);

  await Promise.all([
    sendToTelegram(order),
    sendToSheets(order)
  ]);
}