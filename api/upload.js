export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Получаем base64 из тела запроса
    const { base64, filename } = req.body;

    // Конвертируем base64 в Buffer
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Отправляем на Telegraph
    const FormData = (await import('form-data')).default;
    const fetch = (await import('node-fetch')).default;

    const form = new FormData();
    form.append('file', buffer, {
      filename: filename || 'image.jpg',
      contentType: 'image/jpeg'
    });

    const response = await fetch('https://telegra.ph/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const data = await response.json();

    if (data && data[0] && data[0].src) {
      res.status(200).json({ url: 'https://telegra.ph' + data[0].src });
    } else {
      res.status(500).json({ error: 'Upload failed', data });
    }
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
}