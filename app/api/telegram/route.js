export const dynamic = "force-dynamic";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = "https://project-rino.vercel.app";

const RECIPE_KEYWORDS = [
  "recipe", "recipes", "food", "cooking", "kitchen", "chef", "tasty",
  "delicious", "bishul", "maachal", "mako.co.il/food", "walla.co.il/food",
  "allrecipes", "seriouseats", "bonappetit", "epicurious"
];

function looksLikeRecipeUrl(url) {
  const lower = url.toLowerCase();
  return RECIPE_KEYWORDS.some(k => lower.includes(k));
}

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request) {
  const body = await request.json();
  const message = body?.message;
  const text = message?.text ?? "";
  const chatId = message?.chat?.id;

  if (!chatId) return new Response("ok");

  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (!urlMatch) return new Response("ok");

  const url = urlMatch[0];

  if (!looksLikeRecipeUrl(url)) {
    return new Response("ok");
  }

  try {
    const res = await fetch(`${SITE_URL}/api/share?url=${encodeURIComponent(url)}`);
    if (res.ok || res.redirected) {
      await sendMessage(chatId, "✅");
    } else {
      await sendMessage(chatId, "❌ לא הצלחתי לשמור את המתכון");
    }
  } catch {
    await sendMessage(chatId, "❌ שגיאה");
  }

  return new Response("ok");
}