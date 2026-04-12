"use client";
import { useAdmin } from "./AdminLock";
import { useState } from "react";

export default function RecipeAdminBar({ recipe }) {
  const isAdmin = useAdmin();
  const [hidden, setHidden] = useState(recipe.hidden ?? false);

  if (!isAdmin) return null;

  async function handleToggleHidden() {
    await fetch(`/api/recipes/${recipe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !hidden }),
    });
    setHidden(h => !h);
  }

  async function handleDelete() {
    if (!confirm("למחוק את המתכון?")) return;
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <>
      <div className="recipe-admin-bar">
        <button className="recipe-admin-btn" onClick={handleToggleHidden} title={hidden ? "הצג מתכון" : "הסתר מתכון"}>
          {hidden ? "👁" : "🙈"}
        </button>
        <a className="recipe-admin-btn" href={`/recipe/${recipe.id}?edit=1`} title="ערוך מתכון">✏️</a>
        <button className="recipe-admin-btn recipe-admin-delete" onClick={handleDelete} title="מחק מתכון">🗑</button>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .recipe-admin-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 52px; background: linear-gradient(to top, rgba(30,18,8,0.65) 0%, transparent 100%); display: flex; align-items: flex-end; justify-content: flex-end; gap: 0.4rem; padding: 0 0.75rem 0.6rem; z-index: 10; }
        .recipe-admin-btn { background: rgba(244,236,216,0.92); border: 1px solid #b6aa8a; border-radius: 8px; width: 34px; height: 34px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: background 0.2s; }
        .recipe-admin-btn:hover { background: #F4ECD8; }
      ` }} />
    </>
  );
}
