import * as cheerio from "cheerio";

export async function scrapeRecipe(url) {
  let html;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Accept-Language": "he-IL,he;q=0.9",
      },
    });
    html = await res.text();
  } catch {
    return { success: false, error: "לא ניתן לגשת לכתובת" };
  }

  const $ = cheerio.load(html);

  // --- Strategy 1: schema.org/Recipe JSON-LD ---
  const scripts = $('script[type="application/ld+json"]');
  let schema = null;

  scripts.each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      const entries = Array.isArray(data) ? data : [data["@graph"] ?? data].flat();
      const recipe = entries.find(
        (e) => e?.["@type"] === "Recipe" || e?.["@type"]?.includes?.("Recipe")
      );
      if (recipe) schema = recipe;
    } catch {}
  });

  if (schema) {
    return {
      success: true,
      source: "schema",
      data: {
        title: schema.name ?? "",
        description: schema.description ?? "",
        image: Array.isArray(schema.image)
          ? schema.image[0]?.url ?? schema.image[0]
          : schema.image?.url ?? schema.image ?? null,
        ingredients: (schema.recipeIngredient ?? []).map((i) => ({
          name: i,
          qty: "",
        })),
        steps: (schema.recipeInstructions ?? []).map((s) =>
          typeof s === "string" ? s : s.text ?? ""
        ),
        time:
          schema.totalTime
            ? formatDuration(schema.totalTime)
            : schema.cookTime
            ? formatDuration(schema.cookTime)
            : null,
        servings: schema.recipeYield ?? null,
        category: schema.recipeCategory ?? null,
        source_url: url,
        source_name: new URL(url).hostname.replace("www.", ""),
      },
    };
  }

  // --- Strategy 2: OpenGraph + visible text fallback ---
  const title =
    $('meta[property="og:title"]').attr("content") ??
    $("h1").first().text().trim() ??
    "מתכון ללא שם";

  const description =
    $('meta[property="og:description"]').attr("content") ??
    $('meta[name="description"]').attr("content") ??
    "";

  const image =
    $('meta[property="og:image"]').attr("content") ?? null;

  // Grab all visible body text as a raw fallback
  $("script, style, nav, footer, header, aside").remove();
  const rawText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000);

  return {
    success: true,
    source: "fallback",
    data: {
      title,
      description,
      image,
      ingredients: [],
      steps: [],
      raw_text: rawText,
      source_url: url,
      source_name: new URL(url).hostname.replace("www.", ""),
    },
  };
}

function formatDuration(iso) {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = parseInt(match[1] ?? 0);
  const m = parseInt(match[2] ?? 0);
  if (h && m) return `${h} שעות ${m} דק׳`;
  if (h) return `${h} שעות`;
  return `${m} דק׳`;
}
