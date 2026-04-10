import { createClient } from "@supabase/supabase-js";

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

  return (
    <>
      <style>{css}</style>
      <header>
        <a href="/" className="back">→ כל המתכונים</a>
        <div className="logo">🫒 <span>ספר</span>המתכונים</div>
      </header>
      {isNew && <div className="new-banner">✨ המתכון נשמר בהצלחה!</div>}
      <div className="detail">
        {recipe.image
          ? <img src={recipe.image} alt={recipe.title} className="detail-img" />
          : <div className="detail-img-placeholder">🍴</div>
        }
        <div className="detail-body">
          {recipe.category && <div className="detail-category">{recipe.category}</div>}
          <h1 className="detail-title">{recipe.title}</h1>
          {recipe.source_url && (
            <div className="detail-source">
              📎 מקור: <a href={recipe.source_url} target="_blank" rel="noreferrer">{recipe.source_name ?? recipe.source_url}</a>
            </div>
          )}
          <div className="detail-pills">
            {recipe.time && <span className="pill">⏱ {recipe.time}</span>}
            {recipe.servings && <span className="pill">👥 {recipe.servings} מנות</span>}
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
                {recipe.steps.map((step, i) => (
                  <div key={i} className="step">
                    <div className="step-num">{i + 1}</div>
                    <div className="step-text">{typeof step === "string" ? step : step.text}</div>
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
      </div>
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
  .detail-img { width: 100%; height: 280px; object-fit: cover; display: block; }
  .detail-img-placeholder { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; font-size: 5rem; background: var(--cream-dark); }
  .detail-body { padding: 1.75rem 1.5rem 4rem; }
  .detail-category { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--olive); font-weight: 700; margin-bottom: 0.4rem; }
  .detail-title { font-family: 'Frank Ruhl Libre', serif; font-size: clamp(1.8rem, 5vw, 2.4rem); font-weight: 900; line-height: 1.15; margin-bottom: 0.6rem; }
  .detail-source { font-size: 0.78rem; color: var(--muted); margin-bottom: 1rem; }
  .detail-source a { color: var(--terra); }
  .detail-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
  .pill { padding: 0.3rem 0.8rem; background: var(--cream); border-radius: 100px; font-size: 0.78rem; color: var(--muted); }
  .pill-warn { background: #FFF3CD; color: #8a6a00; }
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