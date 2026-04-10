export const dynamic = "force-dynamic";
export const revalidate = 0;

const CATEGORIES = ["מאפים", "עוגות וקינוחים", "מרקים", "סלטים", "בשרים", "פסטה", "בלי תנור", "תוספות"];

function formatDuration(iso) {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = parseInt(match[1] ?? 0);
  const m = parseInt(match[2] ?? 0);
  if (h && m) return `${h} שע׳ ${m} דק׳`;
  if (h) return `${h} שעות`;
  return `${m} דק׳`;
}

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.content?.[0]?.text ?? null;
}

export async function GET(request) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { searchParams } = new URL(request.url);
  const sharedUrl = searchParams.get("url");

  if (!sharedUrl) {
    return Response.json({ error: "no-url" }, { status: 400 });
  }

  const hostname = new URL(sharedUrl).hostname.replace("www.", "");

  let title = "מתכון חדש";
  let description = "";
  let image = null;
  let ingredients = [];
  let steps = [];
  let time = null;
  let servings = null;
  let category = null;
  let parse_status = "fallback";

  try {
    const res = await fetch(sharedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Accept-Language": "he-IL,he;q=0.9",
      },
    });
    const html = await res.text();

    // Strategy 1: schema.org JSON-LD
    const scriptMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of scriptMatches) {
      try {
        const json = JSON.parse(match[1]);
        const entries = Array.isArray(json) ? json : [json["@graph"] ?? json].flat();
        const recipe = entries.find(e => {
          const t = e?.["@type"];
          return t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"));
        });
        if (recipe) {
          title = recipe.name ?? title;
          description = recipe.description ?? description;
          const img = recipe.image;
          image = Array.isArray(img) ? (img[0]?.url ?? img[0]) : (img?.url ?? img ?? null);
          ingredients = (recipe.recipeIngredient ?? []).flatMap(i => 
          i.split(/<br\s*\/?>/i)
          .map(s => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())
          .filter(s => s.length > 0)
          .map(s => ({ name: s, qty: "" }))
        );
          steps = (recipe.recipeInstructions ?? []).map(s => typeof s === "string" ? s : s.text ?? "");
          time = formatDuration(recipe.totalTime ?? recipe.cookTime ?? recipe.prepTime ?? null);
          servings = recipe.recipeYield ? String(recipe.recipeYield) : null;
          parse_status = "schema";
          break;
        }
      } catch {}
    }

    // Strategy 2: OG tags
    if (parse_status === "fallback") {
      const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/) ?? html.match(/content="([^"]+)"\s+property="og:title"/);
      const ogDesc = html.match(/property="og:description"\s+content="([^"]+)"/) ?? html.match(/content="([^"]+)"\s+property="og:description"/);
      const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/) ?? html.match(/content="([^"]+)"\s+property="og:image"/);
      if (ogTitle) title = ogTitle[1];
      if (ogDesc) description = ogDesc[1];
      if (ogImage) image = ogImage[1];
    }

    // Strategy 3: AI extraction
    if (ingredients.length === 0 && steps.length === 0) {
      const stripped = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);

      const aiText = await callClaude(`Extract the recipe from this webpage text. Return ONLY a JSON object with these fields:
- title (string)
- description (string, one sentence)
- ingredients (array of strings)
- steps (array of strings)
- time (string e.g. "30 דק'" or null)
- servings (string or null)

Webpage text:
${stripped}

Return only valid JSON, no other text.`);

      if (aiText) {
        try {
          const parsed = JSON.parse(aiText.replace(/```json|```/g, "").trim());
          if (parsed.title) title = parsed.title;
          if (parsed.description) description = parsed.description;
          if (parsed.ingredients?.length) ingredients = parsed.ingredients.map(i => ({ name: i, qty: "" }));
          if (parsed.steps?.length) steps = parsed.steps;
          if (parsed.time) time = parsed.time;
          if (parsed.servings) servings = String(parsed.servings);
          parse_status = "ai";
        } catch {}
      }
    }

    // Strategy 4: AI categorization
    const categoryText = await callClaude(`Based on this recipe, choose exactly one category from this list:
- מאפים — baked goods like pastries, bread, burekas, quiche
- עוגות וקינוחים — cakes, desserts, cookies, sweet treats
- מרקים — soups and stews
- סלטים — salads, dips, spreads like hummus or tahini
- בשרים — meat and poultry dishes
- פסטה — pasta
- בלי תנור — recipes that require NO oven, stovetop or raw/cold dishes only
- תוספות — side dishes like roasted vegetables, potatoes, rice, grains

Recipe title: ${title}
Description: ${description}
Ingredients: ${ingredients.slice(0, 5).map(i => i.name).join(", ")}

Reply with only the Hebrew category name, nothing else.`);

    if (categoryText) {
      const matched = CATEGORIES.find(c => categoryText.trim().includes(c));
      if (matched) category = matched;
    }

  } catch (e) {
    return Response.json({ error: "fetch-failed", detail: String(e) }, { status: 500 });
  }

  const { data: saved, error } = await supabase.from("recipes").insert([{
    title,
    description,
    image,
    ingredients,
    steps,
    time,
    servings,
    source_url: sharedUrl,
    source_name: hostname,
    category,
    parse_status,
  }]).select().single();

  if (error) {
    return Response.json({ error: "save-failed", detail: error.message }, { status: 500 });
  }

  return Response.redirect(new URL("/recipe/" + saved.id + "?new=1", request.url));
}