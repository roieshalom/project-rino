export const dynamic = "force-dynamic";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = "https://project-rino.vercel.app";

function looksLikeRecipeUrl(url) {
  return url.startsWith("http");
}

async function reactToMessage(chatId, messageId, emoji) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setMessageReaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      reaction: [{ type: "emoji", emoji }],
    }),
  });
}

export async function POST(request) {
  const body = await request.json();
  const message = body?.message;
  const text = message?.text ?? "";
  const chatId = message?.chat?.id;
  const messageId = message?.message_id;

  if (!chatId) return new Response("ok");

  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (!urlMatch) return new Response("ok");

  const url = urlMatch[0];

  if (!looksLikeRecipeUrl(url)) return new Response("ok");

  try {
    const res = await fetch(`${SITE_URL}/api/share?url=${encodeURIComponent(url)}`);
    if (res.ok || res.redirected) {
      await reactToMessage(chatId, messageId, "✅");
    } else {
      await reactToMessage(chatId, messageId, "❌");
    }
  } catch {
    await reactToMessage(chatId, messageId, "❌");
  }

  return new Response("ok");
}