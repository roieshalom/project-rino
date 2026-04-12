import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("ingredients");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // collect raw ingredient strings and count occurrences
  const raw = {};
  recipes.forEach(r => {
    if (!Array.isArray(r.ingredients)) return;
    r.ingredients.forEach(ing => {
      const str = (typeof ing === "string" ? ing : ing.name ?? "")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (str.length > 1) raw[str] = (raw[str] || 0) + 1;
    });
  });

  // take the top 80 most frequent raw strings to send to Claude
  const topRaw = Object.entries(raw)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80)
    .map(([str]) => str);

  // ask Claude to normalize each to a base ingredient name
  let mapping = {};
  try {
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
        messages: [{
          role: "user",
          content: `You are normalizing recipe ingredient strings. For each input, return just the base ingredient name — no quantities, no adjectives (cold, fresh, chopped…), no cooking notes. If a string contains multiple ingredients joined by "and"/"or"/"ו", split them and return all as separate entries.

Return a JSON object where each key is the original string and each value is either a single normalized name (string) or an array of names if the string contains multiple ingredients.

Examples:
"2 cups cold butter" → "butter"
"eggs and milk for glazing" → ["eggs", "milk"]
"חצי כוס סוכר חום" → "סוכר"
"ביצה לציפוי" → "ביצה"
"שמן זית כתית מעולה" → "שמן זית"

Ingredient strings:
${topRaw.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Return only valid JSON, no other text.`,
        }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      mapping = JSON.parse(text.replace(/```json|```/g, "").trim());
    }
  } catch {}

  // re-count using normalized names
  const normalized = {};
  Object.entries(raw).forEach(([str, count]) => {
    const mapped = mapping[str] ?? str;
    const names = Array.isArray(mapped) ? mapped : [mapped];
    names.forEach(name => {
      const key = name.trim().toLowerCase();
      if (key.length > 1) normalized[key] = (normalized[key] || 0) + count;
    });
  });

  const top10 = Object.entries(normalized)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json(top10);
}
