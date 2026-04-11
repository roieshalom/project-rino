"use client";

import { useEffect, useState } from "react";
import AdminLock, { useAdmin } from "./components/AdminLock";

const TAGS = ["הכל", "מאפים", "עוגות וקינוחים", "מרקים", "סלטים", "בשרים", "תוספות", "פסטה", "בלי תנור"];

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [activeTag, setActiveTag] = useState("הכל");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isAdmin = useAdmin();

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") { setSearchOpen(false); setSearch(""); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data) => { setRecipes(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new")) setToast({ type: "success", msg: "המתכון נשמר! 🎉" });
    if (params.get("error")) setToast({ type: "error", msg: "לא הצלחנו לשמור את המתכון 😕" });
    if (params.get("tag")) setActiveTag(decodeURIComponent(params.get("tag")));
    if (params.get("new") || params.get("error") || params.get("tag")) {
      window.history.replaceState({}, "", "/");
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  async function handleDelete(e, id) {
    e.preventDefault();
    if (!confirm("למחוק את המתכון?")) return;
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    setRecipes(prev => prev.filter(r => r.id !== id));
  }

  async function handleToggleHidden(e, id, hidden) {
    e.preventDefault();
    await fetch(`/api/recipes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !hidden }),
    });
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, hidden: !hidden } : r));
  }

  const filtered = recipes.filter((r) => {
    if (!isAdmin && r.hidden) return false;
    const matchTag = activeTag === "הכל" || r.category === activeTag;
    const matchSearch = !search || r.title?.includes(search) || r.description?.includes(search);
    return matchTag && matchSearch;
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="grain" />
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      <header>
        <AdminLock />
        <div className="logo">🫒 <span>ספר</span>המתכונים</div>
      </header>
      <div className="hero">
        {searchOpen ? (
          <div className={`search-bar hero-search${searchFocused ? " search-bar-focused" : ""}`}>
            <button
              className={`search-icon-btn${search ? " search-icon-active" : ""} search-icon-focused`}
              onClick={() => { setSearch(""); setSearchOpen(false); }}
              tabIndex={-1}
            >✕</button>
            <input
              autoFocus
              placeholder="חפש מתכון..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        ) : (
          <div className="hero-title-row" onMouseEnter={e => e.currentTarget.classList.add("hovered")} onMouseLeave={e => e.currentTarget.classList.remove("hovered")}>
            <h1 className="hero-title">כל מה שטעים <em>במקום אחד</em></h1>
            <button className="hero-search-btn" onClick={() => setSearchOpen(true)} aria-label="חיפוש">🔍</button>
          </div>
        )}
      </div>
      <div className="filter-bar">
        <span className="recipe-count">{filtered.length} מתכונים</span>
        <div className="tags">
          {TAGS.map((t) => (
            <button key={t} className={`tag ${activeTag === t ? "tag-active" : "tag-inactive"}`} onClick={() => setActiveTag(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div className="content">
        {loading ? (
          <div className="empty-state"><div className="icon">⏳</div><h3>טוען...</h3></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">🍽️</div><h3>אין מתכונים עדיין</h3><p>שתף קישור מהנייד כדי להתחיל</p></div>
        ) : (
          <div className="grid">
            {filtered.map((r) => (
              <div key={r.id} className={`card-wrap${r.hidden ? " card-wrap-hidden" : ""}`}>
                <a href={`/recipe/${r.id}`} className="card">
                  {r.image ? <img src={r.image} alt={r.title} className="card-img" /> : <div className="card-img-placeholder">🍴</div>}
                  <div className="card-body">
                    <div className="card-title">{r.title}</div>
                    {r.description && <div className="card-desc">{r.description}</div>}
                    <div className="card-meta">
                      {r.time && <span className="meta-item">⏱ {r.time}</span>}
                      {r.servings && <span className="meta-item">👥 {r.servings}</span>}
                      {r.source_url && <a href={r.source_url} target="_blank" rel="noreferrer" className="meta-item meta-source" onClick={e => e.stopPropagation()}>📎</a>}
                      {r.parse_status === "fallback" && <span className="meta-badge">טעון עריכה</span>}
                      {r.category && <span className="meta-category">{r.category}</span>}
                    </div>
                  </div>
                </a>
                {isAdmin && (
                  <div className="card-admin-btns">
                    <button className="card-edit-btn" onClick={e => handleToggleHidden(e, r.id, r.hidden)}>{r.hidden ? "👁" : "🙈"}</button>
                    <a href={`/recipe/${r.id}?edit=1`} className="card-edit-btn">✏️</a>
                    <button className="card-delete-btn" onClick={e => handleDelete(e, r.id)}>🗑</button>
                  </div>
                )}
              </div>
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
  header { background: var(--espresso); padding: 0 1.5rem; display: flex; align-items: center; justify-content: space-between; height: 60px; position: sticky; top: 0; z-index: 50; flex-direction: row-reverse; }
  .logo { font-family: 'Frank Ruhl Libre', serif; font-size: 1.5rem; font-weight: 900; color: var(--cream); display: flex; align-items: center; gap: 0.4rem; }
  .logo span { color: var(--terra-light); }
  .toast { position: fixed; top: 70px; right: 50%; transform: translateX(50%); padding: 0.75rem 1.5rem; border-radius: 100px; font-size: 0.9rem; font-weight: 500; z-index: 300; }
  .toast-success { background: var(--olive); color: white; }
  .toast-error { background: var(--terra); color: white; }
  .hero { background: var(--espresso); padding: 0 1.5rem; text-align: center; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 120px; }
  .hero::before { content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 500px; height: 500px; background: radial-gradient(circle, rgba(184,85,48,0.15) 0%, transparent 70%); pointer-events: none; }
  .hero-title-row { display: inline-flex; align-items: center; gap: 0.6rem; cursor: default; }
  .hero-title-row.hovered .hero-title { color: var(--cream-dark); }
  .hero-title-row.hovered .hero-search-btn { opacity: 1; }
  .hero-title { font-family: 'Frank Ruhl Libre', serif; font-size: clamp(2.2rem, 8vw, 4rem); font-weight: 900; color: var(--cream); line-height: 1.05; transition: color 0.2s; }
  .hero-title em { color: var(--terra-light); font-style: normal; }
  .hero-search-btn { background: none; border: none; cursor: pointer; font-size: clamp(1.8rem, 6vw, 3.2rem); line-height: 1; opacity: 0.35; transition: opacity 0.2s; padding: 0; }
  .hero-search-btn:hover { opacity: 1; }
  .search-bar { max-width: 440px; margin: 0 auto; position: relative; }
  .hero-search { max-width: 600px; margin: 0 auto; width: 100%; }
  .search-bar input { width: 100%; padding: 0.85rem 1.2rem 0.85rem 3rem; border-radius: 100px; border: 1px solid rgba(244,236,216,0.15); background: rgba(244,236,216,0.1); color: var(--cream); font-family: 'Heebo', sans-serif; font-size: 0.9rem; outline: none; direction: rtl; text-align: right; transition: border-color 0.2s; }
  .search-bar input::placeholder { color: rgba(244,236,216,0.4); }
  .search-bar-focused input { border-color: rgba(244,236,216,0.6); }
  .search-icon-btn { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 0.95rem; opacity: 0.4; transition: opacity 0.2s; line-height: 1; padding: 0.2rem; color: var(--cream); }
  .search-icon-btn.search-icon-focused { opacity: 0.85; }
  .search-icon-btn.search-icon-active { opacity: 1; font-size: 0.8rem; }
  .filter-bar { max-width: 1100px; margin: 0 auto; padding: 0.85rem 1.25rem; display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid rgba(30,18,8,0.08); }
  .recipe-count { font-family: 'Frank Ruhl Libre', serif; font-size: 1.3rem; font-weight: 700; color: var(--espresso); white-space: nowrap; flex-shrink: 0; }
  .content { max-width: 1100px; margin: 0 auto; padding: 1.25rem 1.25rem 2rem; }
  .tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .tag { padding: 0.3rem 0.85rem; border-radius: 100px; font-size: 0.78rem; cursor: pointer; border: 1.5px solid transparent; font-family: 'Heebo', sans-serif; transition: all 0.15s; }
  .tag-inactive { background: var(--card); color: var(--muted); border-color: var(--cream-dark); }
  .tag-inactive:hover { border-color: var(--terra); color: var(--terra); }
  .tag-active { background: var(--terra); color: white; border-color: var(--terra); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1.1rem; }
  .card-wrap { position: relative; height: 340px; }
  .card-wrap-hidden { opacity: 0.45; }
  .card-admin-btns { position: absolute; top: 0.5rem; left: 0.5rem; display: flex; gap: 0.35rem; z-index: 10; }
  .card-edit-btn, .card-delete-btn { background: rgba(244,236,216,0.92); border: none; border-radius: 8px; width: 32px; height: 32px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; text-decoration: none; }
  .card-edit-btn:hover, .card-delete-btn:hover { background: var(--cream); }
  .card-delete-btn { color: var(--terra); }
  .card { background: var(--card); border-radius: 14px; overflow: hidden; cursor: pointer; border: 1px solid rgba(30,18,8,0.07); box-shadow: 0 1px 3px rgba(30,18,8,0.06); transition: all 0.22s; display: flex; flex-direction: column; height: 100%; }
  .card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(30,18,8,0.12); }
  .card-img { width: 100%; height: 170px; object-fit: cover; display: block; flex-shrink: 0; }
  .card-img-placeholder { width: 100%; height: 170px; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; background: var(--cream-dark); flex-shrink: 0; }
  .card-body { padding: 1rem 1.1rem 1.2rem; flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .card-title { font-family: 'Frank Ruhl Libre', serif; font-size: 1.1rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.35rem; }
  .card-desc { font-size: 0.8rem; color: var(--muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0.75rem; flex-shrink: 0; }
  .card-meta { display: flex; gap: 0.5rem; font-size: 0.72rem; color: var(--muted); flex-wrap: nowrap; align-items: center; margin-top: auto; overflow: hidden; }
  .meta-category { padding: 0.3rem 0.85rem; border-radius: 100px; font-size: 0.78rem; background: var(--card); color: var(--muted); border: 1.5px solid var(--cream-dark); font-family: 'Heebo', sans-serif; white-space: nowrap; margin-right: auto; }
  .meta-badge { background: #FFF3CD; color: #8a6a00; border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.65rem; }
  .meta-source { text-decoration: none; }
  .empty-state { text-align: center; padding: 4rem 2rem; color: var(--muted); }
  .empty-state .icon { font-size: 3rem; margin-bottom: 0.75rem; }
  .empty-state h3 { font-family: 'Frank Ruhl Libre', serif; font-size: 1.3rem; margin-bottom: 0.4rem; color: var(--espresso); }
`;