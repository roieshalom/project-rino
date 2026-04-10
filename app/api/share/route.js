import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function scrapeRecipe(url) {
  let html;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Accept-Language": "he-IL,he;q=0.9",
      },
    });
    html = await res.text();
  } catch {
    return { success: false };
  }

  const $ = cheerio.load(html);
  let schema = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      const entries = Array.isArray(data) ? data : [data["@graph"] ?? data].flat();
      const recipe = entries.find(e => e?.["@type"] === "Recipe" || e?.["@type"]?.includes?.("Recipe"));
      if (recipe) schema = recipe;
    } catch {}
  });

  const hostname = new URL(url).hostname.replace("www.", "");

  if (schema) {
    return {
      success: true, source: "schema",
      data: {
        title: schema.name ?? "",
        description: schema.description ?? "",
        image: Array.isArray(schema.image) ? (schema.image[0]?.url ?? schema.image[0]) : (schema.image?.url ?? schema.image ?? null),
        ingredients: (schema.recipeIngredient ?? []).map(i => ({ name: i, qty: "" })),
        steps: (schema.recipeInstructions ?? []).map(s => typeof s === "string" ? s : s.text ?? ""),
        time: schema.totalTime ?? schema.cookTime ?? null,
        servings: schema.recipeYield ?? null,
        category: schema.recipeCategory ?? null,
        source_url: url, source_name: hostname,
      },
    };
  }

  $("script, style, nav, footer, header, aside").remove();
  return {
    success: true, source: "fallback",
    data: {
      title: $('meta[property="og:title"]').attr("content") ?? $("h1").first().text().trim() ?? "מתכון",
      description: $('meta[property="og:description"]').attr("content") ?? "",
      image: $('meta[property="og:image"]').attr("content") ?? null,
      ingredients: [], steps: [],
      raw_text: $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000),
      source_url: url, source_name: hostname,
    },
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let sharedUrl = searchParams.get("url") ?? searchParams.get("text")?.match(/https?:\/\/[^\s]+/)?.[0];

  if (!sharedUrl) return Response.redirect(new URL("/?error=no-url", request.url));

  const result = await scrapeRecipe(sharedUrl);
  if (!result.success) return Response.redirect(new URL("/?error=scrape-failed", request.url));

  const { data, source } = result;
  const { data: saved, error } = await supabase.from("recipes").insert([{
    title: data.title, description: data.description, image: data.image,
    ingredients: data.ingredients, steps: data.steps, time: data.time,
    servings: data.servings, category: data.category,
    source_url: data.source_url, source_name: data.source_name,
    raw_text: data.raw_text ?? null, parse_status: source,
  }]).select().single();

  if (error) return Response.redirect(new URL("/?error=save-failed", request.url));
  return Response.redirect(new URL(`/recipe/${saved.id}?new=1`, request.url));
}