export default async function handler(req, res) {
  // CORS для локальной разработки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { base64, filename } = req.body;
    if (!base64) return res.status(400).json({ error: 'No base64 provided' });

    // Конвертируем base64 в Buffer
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Формируем multipart/form-data вручную
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const fname = filename || 'image.jpg';

    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fname}"\r\nContent-Type: image/jpeg\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, buffer, footer]);

    const response = await fetch('https://telegra.ph/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString()
      },
      body
    });

    const data = await response.json();

    if (data && data[0] && data[0].src) {
      return res.status(200).json({ url: 'https://telegra.ph' + data[0].src });
    } else {
      return res.status(500).json({ error: 'Upload failed', data });
    }
  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
}