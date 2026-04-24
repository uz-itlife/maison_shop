exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const order = JSON.parse(event.body);

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

  const text = `
🛍 <b>Новый заказ #${order.id}</b>

👤 <b>Покупатель:</b> ${order.name}
📞 <b>Телефон:</b> ${order.phone}
📍 <b>Адрес:</b> ${order.addr}
💳 <b>Оплата:</b> ${order.method}

🧾 <b>Товары:</b>
${order.items.map(i =>
  `• ${i.name}${i.selectedSize ? ` (${i.selectedSize})` : ''} × ${i.qty} шт. = ${(i.price * i.qty).toLocaleString('ru')} сум`
).join('\n')}

💰 <b>Итого: ${Number(order.total).toLocaleString('ru')} сум</b>
🕐 ${new Date(order.date).toLocaleString('ru')}
  `.trim();

  // Отправляем в Telegram и Sheets параллельно
  await Promise.all([
    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML'
      })
    }),
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(order)
    })
  ]);

  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'ok' })
  };
};