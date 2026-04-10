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
      },
    });
    html = await res.text();
  } catch (e) {
    return Response.json({ error: "fetch-failed", detail: String(e) }, { status: 500 });
  }

  const getMetaContent = (html, property) => {
    const match = html.match(new RegExp('property="' + property + '"[^>]*content="([^"]*)"')) 
      ?? html.match(new RegExp('content="([^"]*)"      ?? html.match(new RegExp('content="(et      ?? html.match(new RegExp('content="([^"]*)"  getM      ?? html.match(new Reg) ??      ?? html.match(new RegExp('contegetMetaContent(html, "og:description") ?? "";
  con  con  con  con  con  con  con  con:i  con  con  con  con  con  con  con  con:i  coned  con  con  con  con  con  con  con  con:i  con  con  con  con  con  con  con  con:i  coned  con  con ser  con  con  co,
                                                                    sourc          re          source_name: hostname,
    parse_status: "fallback",
  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  }  or.  }  }  }, { status: 500 });
  }

  return Response.redirect(new URL("/recipes/" + saved.id + "?new=1", request.url));
}
