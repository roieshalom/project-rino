"use client";

import { useEffect, useState } from "react";

const TAGS = ["הכל", "מאפים", "ביצים", "ממרחים", "מרקים", "סלטים", "בשרים"];

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [activeTag, setActiveTag] = useState("הכל");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data) => { setRecipes(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new")) setToast({ type: "success", msg: "המתכון נשמר! 🎉" });
    if (params.get("error")) setToast({ type: "error", msg: "לא הצלחנו לשמור את המתכון 😕" });
    if (params.get("new") || params.get("error")) {
      window.history.replaceState({}, "", "/");
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  const filtered = recipes.filter((r) => {
    const matchTag = activeTag === "הכל" || r.category === activeTag;
    const matchSearch = !search || r.title?.includes(search) || r.description?.includes(search);
    return matchTag && matchSearch;
  });

  return (
    <>
      <style>{css}</style>
      <div className="grain" />
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      <header>
        <div className="logo">🫒 <span>ספר</span>המתכונים</div>
      </header>
      <div className="hero">
        <p className="hero-eyebrow">האוסף המשפחתי שלנו</p>
        <h1 className="hero-title">כל מה שטעים<br /><em>במקום אחד</em></h1>
        <p className="hero-sub">שתף קישור מהנייד ישירות לאוסף שלנו.</p>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input placeholder="חפש מתכון..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="stats-bar">
        <div className="stat"><div className="stat-num">{recipes.length}</div><div className="stat-label">מתכונים</div></div>
        <div className="stat"><div className="stat-num">{[...new Set(recipes.map((r) => r.source_name).filter(Boolean))].length || 0}</div><div className="stat-label">מקורות</div></div>
      </div>
      <div className="content">
        <div className="tags">
          {TAGS.map((t) => (
            <button key={t} className={`tag ${activeTag === t ? "tag-active" : "tag-inactive"}`} onClick={() => setActiveTag(t)}>{t}</button>
          ))}
        </div>
        <div className="section-header">
          <h2 className="section-title">{activeTag === "הכל" ? "כל המתכונים" : activeTag}</h2>
          <span className="section-count">{filtered.length} מתכונים</span>
        </div>
        {loading ? (
          <div className="empty-state"><div className="icon">⏳</div><h3>טוען...</h3></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">🍽️</div><h3>אין מתכונים עדיין</h3><p>שתף קישור מהנייד כדי להתחיל</p></div>
        ) : (
          <div className="grid">
            {filtered.map((r) => (
              <a key={r.id} href={`/recipe/${r.id}`} className="card">
                {r.image ? <img src={r.image} alt={r.title} className="card-img" /> : <div className="card-img-placeholder">🍴</div>}
                <div className="card-body">
                  {r.category && <div className="card-category">{r.category}</div>}
                  <div className="card-title">{r.title}</div>
                  {r.description && <div className="card-desc">{r.description}</div>}
                  <div className="card-meta">
                    {r.time && <span className="meta-item">⏱ {r.time}</span>}
                    {r.servings && <span className="meta-item">👥 {r.servings}</span>}
                    {r.parse_status === "fallback" && <span className="meta-badge">טעון עריכה</span>}
                  </div>
                  {r.source_name && <div className="card-source">🔗 {r.source_name}</div>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --cream: #F4ECD8; --cream-dark: #E8DEC4; --paper: #FAF6EE; --espresso: #1E1208; --olive: #5C6B2E; --olive-light: #8A9E4A; --terra: #B85530; --terra-light: #D4724A; --muted: #8C7B68; --card: #FFFDF7; }
  body { background: var(--cream); color: var(--espresso); font-family: 'Heebo', sans-serif; direction: rtl; min-height: 100vh; }
  a { text-decoration: none; color: inherit; }
  .grain { position: fixed; inset: 0; pointer-events: none; opacity: 0.035; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); z-index: 100; }
  header { background: var(--espresso); padding: 0 1.5rem; display: flex; align-items: center; height: 60px; position: sticky; top: 0;