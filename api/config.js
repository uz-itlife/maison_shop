export default function handler(req, res) {
  res.status(200).json({
    tgToken:   process.env.TELEGRAM_TOKEN,      // ← было TG_TOKEN
    tgChat:    process.env.TELEGRAM_CHAT_ID,    // ← было TG_CHAT
    sheetsUrl: process.env.GOOGLE_SCRIPT_URL    // ← это совпадает ✅
  });
}