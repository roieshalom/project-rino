import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let sharedUrl = searchParams.get("url") ?? searchParams.get("text")?.match(/https?:\/\/[^\s]+/)?.[0];

  if (!sharedUrl) {
    return Response.json({ error: "no-url" }, { status: 400 });
  }

  let html;
  try {
    const res = await fetch(sharedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Accept-Language": "he-IL,he;q=0.9",
      },
    });
    html = await res.text();
  } catch (e) {
    return Response.json({ error: "fetch-failed", detail: e.message }, { status: 500 });
  }

  let title = "מתכון";
  let description = "";
  let image = null;

  try {
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*conte   "([^"]*)"/) ?? html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/);
    cons    cons    cons   ch(/<meta[^>    cons    cons    cons   ch(/<meta[^t=    cons    cons    cons   ch(/<meta[content="([    cons    cons    cons   ch(/<ion"/    cons    cons    cons   ch(/<meta[^>    conrop    cons    cons    cons   ch(/<meta[^>    cons    cons    cons   ch(/<meta[^t=    cons    cons    conage    cons    cons  tle) title = ogTitle[1];
    if (ogDesc) description = ogDesc[1];
    if (ogImage) image = ogImage[1];
  } catch (e) {
    return Response.json({ error: "parse-failed", detail: e.message }, { status: 500 });
  }

  const hostname = new URL(sharedUrl)  const hostname = new URL(sharedUrl)  consata: saved,  cons }  const hostname = nem("recip  const hostna
                                                                                   ce_url: sharedUrl,
    source_name: hostname,
    parse_status:     parse_st  }]).sel ct().single();

  if (error) {
    return Response.json({ error: "save-failed", detail: error.message }, { status: 500 });
  }

  return Response.redirect(new URL(`/recipes/${saved.id}?new=1`, request.url));
}
