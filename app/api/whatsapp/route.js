export const dynamic = "force-dynamic";

const RECIPE_DOMAINS = [
  "mako.co.il", "maachal.com", "walla.co.il", "food.walla", "107recipes",
  "allrecipes", "seriouseats", "bonappetit", "epicurious", "ynet.co.il",
  "haaretz", "recipes", "recipe", "אוכל", "מתכון", "bishul", "food",
  "cooking", "kitchen", "chef", "tasty", "delicious"
];

function looksLikeRecipeUrl(url) {
  const lower = url.toLowerCase();
  return RECIPE_DOMAINS.some(d => lower.includes(d));
}

async function scrapeAndSave(url) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://project-rino.vercel.app";
  const res = await fetch(`${baseUrl}/api/share?url=${encodeURIComponent(url)}&silent=1`);
  return res.ok;
}

export async function POST(request) {
  const formData = await request.formData();
  const body = formData.get("Body") ?? "";
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = formData.get("To"); // Twilio sandbox number
  const toNumber = formData.get("From"); // sender

  const urlMatch = body.match(/https?:\/\/[^\s]+/);

  if (!urlMatch) {
    return new Response("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const url = urlMatch[0];

  if (!looksLikeRecipeUrl(url)) {
    return new Response("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Save the recipe
  const saved = await scrapeAndSave(url);

  // Reply with emoji via Twilio
  if (saved) {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        Body: "✅",
      }),
    });
  }

  return new Response("<Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}