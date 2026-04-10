import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
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
          ingredients = (recipe.recipeIngredient ?? []).map(i => ({ name: i, qty: "" }));
          steps = (recipe.recipeInstructions ?? []).map(s => typeof s === "string" ? s : s.text ?? "");
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

    // Strategy 3: AI extraction if still no ingredients/steps
    if (ingredients.length === 0 && steps.length === 0) {
      const stripped = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);

      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1500,
          messages: [{
            role: "user",
            content: `Extract the recipe from this webpage text. Return ONLY a JSON object with these fields:
- title (string)
- description (string, one sentence)
- ingredients (array of strings, each ingredient as written)
- steps (array of strings, each step as written)
- time (string, e.g. "30 דק'" or null)
- servings (string or null)

Webpage text:
${stripped}

Return only valid JSON, no other text.`
          }]
        })
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const text = aiData.content?.[0]?.text ?? "";
        try {
          const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
          if (parsed.title) title = parsed.title;
          if (parsed.description) description = parsed.description;
          if (parsed.ingredients?.length) ingredients = parsed.ingredients.map(i => ({ name: i, qty: "" }));
          if (parsed.steps?.length) steps = parsed.steps;
          parse_status = "ai";
        } catch {}
      }
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
    source_url: sharedUrl,
    source_name: hostname,
    parse_status,
  }]).select().single();

  if (error) {
    return Response.json({ error: "save-failed", detail: error.message }, { status: 500 });
  }

  return Response.redirect(new URL("/recipe/" + saved.id + "?new=1", request.url));
}