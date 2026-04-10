import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { searchParams } = new URL(request.url);
  const sharedUrl = searchParams.get("url");

  if (!sharedUrl) {
    return Response.json({ error: "no-url" }, { status: 400 });
  }

  const hostname = new URL(sharedUrl).hostname.replace("www.", "");

  const { data: saved, error } = await supabase.from("recipes").insert([{
    title: "מתכון חדש",
    description: "",
    image: null,
    ingredients: [],
    steps: [],
    source_url: sharedUrl,
    source_name: hostname,
    parse_status: "fallback",
  }]).select().single();

  if (error) {
    return Response.json({ error: "save-failed", detail: error.message }, { status: 500 });
  }

  return Response.redirect(new URL("/recipe/" + saved.id + "?new=1", request.url));
}