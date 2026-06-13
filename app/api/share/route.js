import { shareRecipe } from "../../../lib/recipe-share";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const addedBy = searchParams.get("added_by") ?? null;
  const jsonMode = searchParams.get("format") === "json";

  const result = await shareRecipe({ url, addedBy });

  if (!result.ok) {
    if (result.error === "no-url") {
      return Response.json({ error: "no-url" }, { status: 400 });
    }
    if (result.error === "fetch-failed") {
      return Response.json({ error: "fetch-failed", detail: result.detail }, { status: 500 });
    }
    if (result.error === "save-failed") {
      return Response.json({ error: "save-failed", detail: result.detail }, { status: 500 });
    }
    // parse-failed
    if (jsonMode) {
      return Response.json({ error: "parse-failed" }, { status: 422 });
    }
    return Response.redirect(new URL("/?error=parse-failed", request.url));
  }

  if (jsonMode) {
    return Response.json({ id: result.id, parse_status: result.parse_status });
  }

  const suffix = result.parse_status === "fallback" ? "?new=1&warn=1" : "?new=1";
  return Response.redirect(new URL("/recipe/" + result.id + suffix, request.url));
}
