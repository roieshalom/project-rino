import { createClient } from "@supabase/supabase-js";
import EditRecipe from "../../components/EditRecipe";
import AdminLock from "../../components/AdminLock";
import RecipeAdminBar from "../../components/RecipeAdminBar";
import UploaderPill from "../../components/UploaderPill";
import HeartButton from "../../components/HeartButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RecipePage({ params, searchParams }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return <div style={{padding:"2rem",color:"red"}}>Missing env vars. URL: {String(url)} KEY: {String(!!key)}</div>;
  }

  const supabase = createClient(url, key);
  const id = params?.id;

  if (!id) {
    return <div style={{padding:"2rem",color:"red"}}>No ID in params: {JSON.stringify(params)}</div>;
  }

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return <div style={{padding:"2rem",color:"red"}}>Supabase error: {error.message} — ID: {id}</div>;
  }

  if (!recipe) {
    return <div style={{padding:"2rem",color:"red"}}>No recipe found for ID: {id}</div>;
  }

  const isNew = searchParams?.new === "1";
  const isEdit = searchParams?.edit === "1";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <header>
        <a href="/" className="back">→ כל המתכונים</a>
        <div className="logo">🫒 <span>ספר</span>המתכונים</div>
        <AdminLock />
      </header>
      {isNew && <div className="new-banner">✨ המתכון נשמר בהצלחה!</div>}
      {isEdit ? <EditRecipe recipe={recipe} /> :
      <div className="detail">
        <div className="detail-img-wrap">
          {recipe.image
            ? <img src={recipe.image} alt={recipe.title} className={`detail-img${recipe.hidden ? " detail-img-hidden" : ""}`} />
            : <div className="detail-img-placeholder">🍴</div>
          }
          <div className="detail-img-top-right"><HeartButton id={recipe.id} /></div>
          <RecipeAdminBar recipe={recipe} />
        </div>
        <div className="detail-body">
          <h1 className="detail-title">{recipe.title}</h1>
          <div className="detail-pills">
            {recipe.category && <a href={`/?tag=${encodeURIComponent(recipe.category)}`} className="pill pill-category pill-category-link">{recipe.category}</a>}
            <UploaderPill name={recipe.added_by} />
            {recipe.time && <span className="pill">🕐 {recipe.time}</span>}
            {recipe.servings && <span className="pill">👥 {recipe.servings} מנות</span>}
            {recipe.source_url && <a href={recipe.source_url} target="_blank" rel="noreferrer" className="pill pill-link">📎 {new URL(recipe.source_url).hostname.replace("www.", "")}</a>}
            {recipe.parse_status === "fallback" && <span className="pill pill-warn">⚠️ טעון עריכה</span>}
          </div>
          {recipe.description && <p className="detail-desc">{recipe.description}</p>}
          {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
            <section>
              <h2 className="section-title">🛒 מרכיבים</h2>
              <div className="ingredients">
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="ingredient">
                    <span>{(typeof ing === "string" ? ing : ing.name).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}</span>
                    {ing.qty && <span className="qty">{ing.qty}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
          {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
          <section>
            <h2 className="section-title">👨‍🍳 אופן ההכנה</h2>
            <div className="steps">
              {recipe.steps.flatMap((step) => {
                const raw = typeof step === "string" ? step : step.text ?? "";
                return raw.split(/<br\s*\/?>/i)
                  .map(t => t.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())
                  .filter(t => t.length > 0);
              }).map((step, i) => (
                <div key={i} className="step">
                  <div className="step-num">{i + 1}</div>
                  <div className="step-text">{step}</div>
                </div>
              ))}
            </div>
          </section>
        )}
          {recipe.parse_status === "fallback" && recipe.raw_text && (
            <section>
              <h2 className="section-title">📄 טקסט גולמי</h2>
              <p className="raw-text">{recipe.raw_text}</p>
            </section>
          )}
        </div>
      </div>}
    </>
  );
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --cream: #F4ECD8; --cream-dark: #E8DEC4; --espresso: #1E1208; --olive: #5C6B2E; --terra: #B85530; --terra-light: #D4724A; --muted: #8C7B68; --paper: #FAF6EE; }
  body { background: var(--paper); color: var(--espresso); font-family: 'Heebo', sans-serif; direction: rtl; min-height: 100vh; }
  a { text-decoration: none; color: inherit; }
  header { background: var(--espresso); padding: 0 1.5rem; display: flex; align-items: center; justify-content: space-between; height: 60px; position: sticky; top: 0; z-index: 50; }
  .back { color: var(--cream); font-size: 0.85rem; }
  .logo { font-family: 'Frank Ruhl Libre', serif; font-size: 1.3rem; font-weight: 900; color: var(--cream); display: flex; align-items: center; gap: 0.3rem; }
  .logo span { color: var(--terra-light); }
  .new-banner { background: var(--olive); color: white; text-align: center; padding: 0.6rem; font-size: 0.88rem; }
  .detail { max-width: 680px; margin: 0 auto; }
  .detail-img-wrap { position: relative; }
  .detail-img-top-right { position: absolute; top: 0.6rem; right: 0.6rem; z-index: 10; }
  .detail-img { width: 100%; height: 280px; object-fit: cover; display: block; }
  .detail-img-hidden { opacity: 0.4; }
  .detail-img-placeholder { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; font-size: 5rem; background: var(--cream-dark); }
  .detail-body { padding: 1.75rem 1.5rem 4rem; }
  .detail-title { font-family: 'Frank Ruhl Libre', serif; font-size: clamp(1.8rem, 5vw, 2.4rem); font-weight: 900; line-height: 1.15; margin-bottom: 0.6rem; }
  .pill-category { background: var(--card); color: var(--muted); border: 1.5px solid var(--cream-dark); }
  .pill-category-link { text-decoration: none; transition: border-color 0.15s, color 0.15s; cursor: pointer; }
  .pill-category-link:hover { border-color: var(--terra); color: var(--terra); }
.detail-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
  .pill { padding: 0.3rem 0.8rem; background: var(--cream); border-radius: 100px; font-size: 0.78rem; color: var(--muted); }
  .pill-warn { background: #FFF3CD; color: #8a6a00; }
  .pill-uploader { background: var(--cream); color: var(--muted); }
  .pill-link { text-decoration: none; color: var(--muted); }
  .detail-desc { font-size: 0.95rem; line-height: 1.65; color: var(--muted); margin-bottom: 2rem; }
  .section-title { font-family: 'Frank Ruhl Libre', serif; font-size: 1.15rem; font-weight: 700; margin: 1.75rem 0 0.75rem; }
  .ingredients { background: var(--cream); border-radius: 12px; padding: 0.5rem 1.1rem; }
  .ingredient { padding: 0.5rem 0; border-bottom: 1px solid var(--cream-dark); font-size: 0.9rem; display: flex; justify-content: space-between; }
  .ingredient:last-child { border-bottom: none; }
  .qty { color: var(--terra); font-weight: 700; font-size: 0.85rem; }
  .steps { display: flex; flex-direction: column; gap: 0.9rem; }
  .step { display: flex; gap: 0.9rem; align-items: flex-start; }
  .step-num { width: 26px; height: 26px; min-width: 26px; border-radius: 50%; background: var(--terra); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; margin-top: 0.15rem; }
  .step-text { font-size: 0.9rem; line-height: 1.65; }
  .raw-text { font-size: 0.82rem; line-height: 1.65; color: var(--muted); background: var(--cream); border-radius: 10px; padding: 1rem; white-space: pre-wrap; }
`;