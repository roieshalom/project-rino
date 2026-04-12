"use client";

import { useEffect, useRef, useState } from "react";
import AdminLock, { useAdmin } from "./components/AdminLock";

const TAGS = ["❤️", "מאפים", "עוגות וקינוחים", "מרקים", "סלטים", "בשרים", "תוספות", "פסטה", "בלי תנור"];
const HEART_TAG = "❤️";

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [activeTags, setActiveTags] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [hearts, setHearts] = useState([]);
  const gridRef = useRef();
  const isAdmin = useAdmin();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("hearted_recipes") || "[]");
    setHearts(saved);
  }, []);

  function toggleHeart(e, id) {
    e.preventDefault();
    // FLIP: capture positions before update
    const cards = gridRef.current?.querySelectorAll("[data-id]");
    const before = {};
    cards?.forEach(el => { before[el.dataset.id] = el.getBoundingClientRect(); });

    setHearts(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("hearted_recipes", JSON.stringify(next));
      return next;
    });

    // FLIP: animate from old to new positions after DOM settles
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cards?.forEach(el => {
          const old = before[el.dataset.id];
          if (!old) return;
          const now = el.getBoundingClientRect();
          const dy = old.top - now.top;
          const dx = old.left - now.left;
          if (Math.abs(dy) < 1 && Math.abs(dx) < 1) return;
          el.animate([
            { transform: `translate(${dx}px, ${dy}px)`, easing: "ease-out" },
            { transform: "translate(0, 0)" }
          ], { duration: 350, fill: "none" });
        });
      });
    });
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") { setSearch(""); }
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
    if (params.get("tag")) setActiveTags([decodeURIComponent(params.get("tag"))]);
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

  const hiddenCount = recipes.filter(r => r.hidden).length;

  const filtered = recipes.filter((r) => {
    if (showHidden) return r.hidden;
    if (!isAdmin && r.hidden) return false;
    const heartOnly = activeTags.includes(HEART_TAG);
    const otherTags = activeTags.filter(t => t !== HEART_TAG);
    if (heartOnly && !hearts.includes(r.id)) return false;
    const matchTag = otherTags.length === 0 || otherTags.includes(r.category);
    const matchSearch = !search || r.title?.includes(search) || r.description?.includes(search);
    return matchTag && matchSearch;
  }).sort((a, b) => {
    const aH = hearts.includes(a.id) ? 1 : 0;
    const bH = hearts.includes(b.id) ? 1 : 0;
    return bH - aH;
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
        <div className="hero-inner">
        <h1 className="hero-title">כל מה שטעים <em>במקום אחד</em></h1>
        <div className="hero-count">
          <span className="recipe-count">{showHidden ? `${hiddenCount} מוסתרים` : `${filtered.length} מתכונים`}</span>
          {isAdmin && hiddenCount > 0 && (
            <button className="hidden-count-btn" onClick={() => setShowHidden(v => !v)}>
              {showHidden ? "← כל המתכונים" : `${hiddenCount} מוסתרים`}
            </button>
          )}
        </div>
        </div>
      </div>
      <div className="filter-bar">
        <div className={`search-bar filter-search${searchFocused ? " search-bar-focused" : ""}`}>
          <button
            className={`search-icon-btn${search ? " search-icon-active" : ""}`}
            onClick={() => setSearch("")}
            tabIndex={-1}
          >{search ? "✕" : "🔍"}</button>
          <input
            placeholder="חפש מתכון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
        <div className="tags">
          {TAGS.map((t) => (
            <button key={t} className={`tag ${activeTags.includes(t) ? "tag-active" : "tag-inactive"}`} onClick={() => setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>{t}</button>
          ))}
        </div>
        <TagsDropdown activeTags={activeTags} setActiveTags={setActiveTags} />
      </div>
      <div className="content">
        {loading ? (
          <div className="empty-state">
            <div className="uib-container">
              <div className="uib-dot"></div>
              <div className="uib-dot"></div>
              <div className="uib-dot"></div>
              <div className="uib-dot"></div>
            </div>
            <h3>רגע, אבא</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">🍽️</div><h3>אין מתכונים עדיין</h3><p>שתף קישור מהנייד כדי להתחיל</p></div>
        ) : (
          <div className="grid" ref={gridRef}>
            {filtered.map((r) => (
              <div key={r.id} data-id={r.id} className={`card-wrap${r.hidden ? " card-wrap-hidden" : ""}`}>
                <button className={`card-heart-btn${hearts.includes(r.id) ? " card-heart-active" : ""}`} onClick={e => toggleHeart(e, r.id)}><span className={hearts.includes(r.id) ? "heart-lit" : "heart-unlit"}>{hearts.includes(r.id) ? "❤️" : "♡"}</span></button>
                <a href={`/recipe/${r.id}`} className="card">
                  {r.image ? <img src={r.image} alt={r.title} className="card-img" /> : <div className="card-img-placeholder">🍴</div>}
                  <div className="card-body">
                    <div className="card-title">{r.title}</div>
                    {r.description && <div className="card-desc">{r.description}</div>}
                    <div className="card-meta">
                      {r.time && <span className="meta-item">🕐 {r.time}</span>}
                      {r.servings && <span className="meta-item">👥 {r.servings}</span>}
{r.parse_status === "fallback" && <span className="meta-badge">טעון עריכה</span>}
                      {r.category && <span className="meta-category">{r.category}</span>}
                      {isAdmin && r.added_by && <span className="meta-uploader">{r.added_by}</span>}
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

function TagsDropdown({ activeTags, setActiveTags }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const label = activeTags.length === 0 ? "קטגוריות" : activeTags.join(", ");

  return (
    <div className="tags-dropdown" ref={ref}>
      <button className="tags-dropdown-btn" onClick={() => setOpen(v => !v)}>
        <span className="tags-dropdown-label">{label}</span>
        <span className="tags-dropdown-arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="tags-dropdown-menu">
          {TAGS.map(t => (
            <label key={t} className="tags-dropdown-item">
              <input
                type="checkbox"
                checked={activeTags.includes(t)}
                onChange={() => setActiveTags(prev =>
                  prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                )}
              />
              {t}
            </label>
          ))}
          {activeTags.length > 0 && (
            <button className="tags-dropdown-clear" onClick={() => { setActiveTags([]); setOpen(false); }}>נקה הכל</button>
          )}
        </div>
      )}
    </div>
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
  .hero { background: var(--espresso); position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100px; }
  .hero-inner { max-width: 1100px; width: 100%; padding: 0 1.25rem; display: flex; align-items: center; justify-content: space-between; direction: rtl; }
  .hero::before { content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 500px; height: 500px; background: radial-gradient(circle, rgba(184,85,48,0.15) 0%, transparent 70%); pointer-events: none; }
  .hero-title { font-family: 'Frank Ruhl Libre', serif; font-size: clamp(1.6rem, 4vw, 2.8rem); font-weight: 900; color: var(--cream); line-height: 1.05; }
  .hero-title em { color: var(--terra-light); font-style: normal; }
  .hero-count { display: flex; flex-direction: column; align-items: flex-start; gap: 0.15rem; flex-shrink: 0; }
  .recipe-count { font-family: 'Frank Ruhl Libre', serif; font-size: 1.3rem; font-weight: 700; color: var(--cream); white-space: nowrap; }
  .hidden-count-btn { background: none; border: none; cursor: pointer; font-size: 0.72rem; color: rgba(244,236,216,0.55); font-family: 'Heebo', sans-serif; padding: 0; text-decoration: underline; text-underline-offset: 2px; transition: color 0.15s; }
  .hidden-count-btn:hover { color: var(--terra-light); }
  .filter-bar { max-width: 1100px; margin: 0 auto; padding: 0.75rem 1.25rem; display: flex; flex-direction: row; direction: rtl; align-items: center; gap: 0.75rem; }
  .search-bar { position: relative; flex-shrink: 0; }
  .filter-search { width: 200px; }
  .filter-search input { width: 100%; padding: 0.55rem 1rem 0.55rem 2.4rem; border-radius: 100px; border: 1.5px solid var(--cream-dark); background: var(--card); color: var(--espresso); font-family: 'Heebo', sans-serif; font-size: 0.85rem; outline: none; direction: rtl; text-align: right; transition: border-color 0.2s; }
  .filter-search input::placeholder { color: var(--muted); }
  .search-bar-focused.filter-search input { border-color: var(--terra); }
  .search-icon-btn { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 0.85rem; opacity: 0.45; transition: opacity 0.2s; line-height: 1; padding: 0.15rem; color: var(--espresso); }
  .search-icon-btn.search-icon-active { opacity: 0.7; font-size: 0.75rem; }
  .content { max-width: 1100px; margin: 0 auto; padding: 1.25rem 1.25rem 2rem; }
  .tags { display: flex; gap: 0.5rem; flex-wrap: wrap; direction: rtl; }
  .tags-dropdown { display: none; position: relative; }
  .tags-dropdown-btn { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.45rem 0.85rem; border: 1.5px solid var(--cream-dark); border-radius: 10px; background: var(--card); font-family: 'Heebo', sans-serif; font-size: 0.85rem; color: var(--espresso); cursor: pointer; min-width: 130px; transition: border-color 0.15s; }
  .tags-dropdown-btn:focus { outline: none; border-color: var(--terra); }
  .tags-dropdown-label { flex: 1; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tags-dropdown-arrow { font-size: 0.65rem; color: var(--muted); flex-shrink: 0; }
  .tags-dropdown-menu { position: absolute; top: calc(100% + 6px); right: 0; background: var(--card); border: 1.5px solid var(--cream-dark); border-radius: 12px; box-shadow: 0 8px 24px rgba(30,18,8,0.12); z-index: 200; min-width: 170px; padding: 0.4rem 0; }
  .tags-dropdown-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 1rem; font-family: 'Heebo', sans-serif; font-size: 0.88rem; color: var(--espresso); cursor: pointer; direction: rtl; }
  .tags-dropdown-item:hover { background: var(--cream); }
  .tags-dropdown-item input[type="checkbox"] { accent-color: var(--terra); width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; }
  .tags-dropdown-clear { display: block; width: calc(100% - 2rem); margin: 0.4rem 1rem 0.2rem; padding: 0.4rem 0; border: 1.5px solid var(--terra); border-radius: 8px; background: none; color: var(--terra); font-family: 'Heebo', sans-serif; font-size: 0.8rem; cursor: pointer; transition: background 0.15s; }
  .tags-dropdown-clear:hover { background: rgba(184,85,48,0.08); }
  @media (max-width: 600px) {
    .tags { display: none; }
    .tags-dropdown { display: block; }
  }
  .tag { padding: 0.3rem 0.85rem; border-radius: 100px; font-size: 0.78rem; cursor: pointer; border: 1.5px solid transparent; font-family: 'Heebo', sans-serif; transition: all 0.15s; }
  .tag-inactive { background: var(--card); color: var(--muted); border-color: var(--cream-dark); }
  .tag-inactive:hover { border-color: var(--terra); color: var(--terra); }
  .tag-active { background: var(--terra); color: white; border-color: var(--terra); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1.1rem; }
  .card-wrap { position: relative; height: 340px; transition: transform 0.22s, box-shadow 0.22s; border-radius: 14px; }
  .card-wrap:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(30,18,8,0.12); }
  .card-wrap-hidden .card { opacity: 0.45; }
  .card-heart-btn { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(244,236,216,0.92); border: 1px solid #b6aa8a; border-radius: 8px; width: 32px; height: 32px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: background 0.2s, transform 0.15s; }
  .card-heart-btn:hover { background: var(--cream); transform: scale(1.15); }
  .card-heart-btn:hover .heart-unlit { opacity: 0.7; }
  .card-heart-active { transform: scale(1.1); }
  .heart-unlit { opacity: 0.5; color: var(--terra); font-size: 1.1rem; transition: opacity 0.2s; }
  .card-admin-btns { position: absolute; top: 0.5rem; left: 0.5rem; display: flex; gap: 0.35rem; z-index: 10; }
  .card-edit-btn, .card-delete-btn { background: rgba(244,236,216,0.92); border: 1px solid #b6aa8a; border-radius: 8px; width: 32px; height: 32px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s, border-color 0.2s; text-decoration: none; }
  .card-edit-btn:hover, .card-delete-btn:hover { background: var(--cream); }
  .card-delete-btn { color: var(--terra); }
  .card { background: var(--card); border-radius: 14px; overflow: hidden; cursor: pointer; border: 1px solid rgba(30,18,8,0.07); box-shadow: 0 1px 3px rgba(30,18,8,0.06); display: flex; flex-direction: column; height: 100%; transition: opacity 0.22s; }
  .card-img { width: 100%; height: 170px; object-fit: cover; display: block; flex-shrink: 0; }
  .card-img-placeholder { width: 100%; height: 170px; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; background: var(--cream-dark); flex-shrink: 0; }
  .card-body { padding: 1rem 1.1rem 1.2rem; flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .card-title { font-family: 'Frank Ruhl Libre', serif; font-size: 1.1rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.35rem; }
  .card-desc { font-size: 0.8rem; color: var(--muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0.75rem; flex-shrink: 0; }
  .card-meta { display: flex; gap: 0.5rem; font-size: 0.72rem; color: var(--muted); flex-wrap: nowrap; align-items: center; margin-top: auto; overflow: hidden; }
  .meta-category { padding: 0.3rem 0.85rem; border-radius: 100px; font-size: 0.78rem; background: var(--card); color: var(--muted); border: 1.5px solid var(--cream-dark); font-family: 'Heebo', sans-serif; white-space: nowrap; margin-right: auto; }
  .meta-uploader { padding: 0.3rem 0.85rem; border-radius: 100px; font-size: 0.78rem; background: var(--card); color: var(--muted); border: 1.5px solid var(--cream-dark); font-family: 'Heebo', sans-serif; white-space: nowrap; }
  .meta-badge { background: #FFF3CD; color: #8a6a00; border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.65rem; }
  .meta-source { text-decoration: none; }
  .empty-state { text-align: center; padding: 4rem 2rem; color: var(--muted); }
  .empty-state .icon { font-size: 3rem; margin-bottom: 0.75rem; }
  .empty-state h3 { font-family: 'Frank Ruhl Libre', serif; font-size: 1.3rem; margin-bottom: 0.4rem; color: var(--espresso); }
  .uib-container { --uib-size: 78px; --uib-color: var(--terra); --uib-speed: 1.4s; position: relative; display: flex; align-items: center; justify-content: center; width: calc(var(--uib-size) * 0.51); height: calc(var(--uib-size) * 0.51); margin: 0 auto 1rem; }
  .uib-dot { position: relative; display: flex; flex-shrink: 0; align-items: center; height: 100%; width: 25%; transform-origin: center top; }
  .uib-dot::after { content: ''; display: block; width: 100%; height: 25%; border-radius: 50%; background-color: var(--uib-color); transition: background-color 0.3s ease; }
  .uib-dot:first-child { animation: uib-swing var(--uib-speed) linear infinite; }
  .uib-dot:last-child { animation: uib-swing2 var(--uib-speed) linear infinite; }
  @keyframes uib-swing { 0%{transform:rotate(0deg);animation-timing-function:ease-out} 25%{transform:rotate(-70deg);animation-timing-function:ease-in} 50%{transform:rotate(0deg);animation-timing-function:linear} }
  @keyframes uib-swing2 { 0%{transform:rotate(0deg);animation-timing-function:linear} 50%{transform:rotate(0deg);animation-timing-function:ease-out} 75%{transform:rotate(70deg);animation-timing-function:ease-in} }
`;