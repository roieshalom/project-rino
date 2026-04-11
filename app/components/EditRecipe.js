"use client";
import { useState, useRef } from "react";

const CATEGORIES = ["מאפים", "עוגות וקינוחים", "מרקים", "סלטים", "בשרים", "פסטה", "בלי תנור", "תוספות"];

export default function EditRecipe({ recipe }) {
  const [title, setTitle] = useState(recipe.title ?? "");
  const [description, setDescription] = useState(recipe.description ?? "");
  const [category, setCategory] = useState(recipe.category ?? "");
  const [time, setTime] = useState(recipe.time ?? "");
  const [servings, setServings] = useState(recipe.servings ?? "");
  const [image, setImage] = useState(recipe.image ?? "");
  const [imageInput, setImageInput] = useState("");
  const [ingredients, setIngredients] = useState(
    (recipe.ingredients ?? []).map(i => typeof i === "string" ? i : i.name)
  );
  const [steps, setSteps] = useState(recipe.steps ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  function updateIngredient(i, val) {
    setIngredients(prev => prev.map((v, idx) => idx === i ? val : v));
  }
  function removeIngredient(i) {
    setIngredients(prev => prev.filter((_, idx) => idx !== i));
  }
  function updateStep(i, val) {
    setSteps(prev => prev.map((v, idx) => idx === i ? val : v));
  }
  function removeStep(i) {
    setSteps(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/recipes/${recipe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        time,
        servings,
        image,
        ingredients: ingredients.filter(Boolean).map(name => ({ name, qty: "" })),
        steps: steps.filter(Boolean),
      }),
    });
    if (res.ok) {
      window.location.href = `/recipe/${recipe.id}`;
    } else {
      const data = await res.json();
      setError(data.error ?? "שגיאה בשמירה");
      setSaving(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: editCss }} />
      <div className="edit-wrap">

        {/* Image */}
        <div className="edit-img-section">
          {image
            ? <img src={image} alt="תמונה" className="edit-img-preview" />
            : <div className="edit-img-placeholder">🍴</div>
          }
          <div className="edit-img-actions">
            <button className="edit-img-btn" onClick={() => fileRef.current.click()}>📁 העלה תמונה</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
            <span className="edit-img-or">או</span>
            <input
              className="edit-input edit-img-url"
              placeholder="הדבק קישור לתמונה..."
              value={imageInput}
              dir="ltr"
              onChange={e => setImageInput(e.target.value)}
              onBlur={() => { if (imageInput.trim()) { setImage(imageInput.trim()); setImageInput(""); } }}
            />
          </div>
        </div>

        <div className="edit-body">

          {/* Title */}
          <div className="edit-field">
            <label className="edit-label">כותרת</label>
            <input className="edit-input edit-title-input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="edit-field">
            <label className="edit-label">תיאור</label>
            <textarea className="edit-input edit-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          {/* Pills row */}
          <div className="edit-pills-row">
            <div className="edit-field edit-field-inline">
              <label className="edit-label">קטגוריה</label>
              <select className="edit-input edit-select" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">ללא</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="edit-field edit-field-inline">
              <label className="edit-label">זמן</label>
              <input className="edit-input edit-short" value={time} onChange={e => setTime(e.target.value)} placeholder="30 דק׳" />
            </div>
            <div className="edit-field edit-field-inline">
              <label className="edit-label">מנות</label>
              <input className="edit-input edit-short" value={servings} onChange={e => setServings(e.target.value)} placeholder="4" />
            </div>
          </div>

          {/* Ingredients */}
          <div className="edit-field">
            <label className="edit-label">מרכיבים</label>
            {ingredients.map((ing, i) => (
              <div key={i} className="edit-list-row">
                <input className="edit-input edit-list-input" value={ing} onChange={e => updateIngredient(i, e.target.value)} />
                <button className="edit-remove-btn" onClick={() => removeIngredient(i)}>✕</button>
              </div>
            ))}
            <button className="edit-add-btn" onClick={() => setIngredients(prev => [...prev, ""])}>+ הוסף מרכיב</button>
          </div>

          {/* Steps */}
          <div className="edit-field">
            <label className="edit-label">שלבי הכנה</label>
            {steps.map((step, i) => (
              <div key={i} className="edit-list-row">
                <div className="edit-step-num">{i + 1}</div>
                <textarea className="edit-input edit-list-input edit-textarea" value={typeof step === "string" ? step : step.text ?? ""} onChange={e => updateStep(i, e.target.value)} rows={2} />
                <button className="edit-remove-btn" onClick={() => removeStep(i)}>✕</button>
              </div>
            ))}
            <button className="edit-add-btn" onClick={() => setSteps(prev => [...prev, ""])}>+ הוסף שלב</button>
          </div>

          {error && <p className="edit-error">{error}</p>}

          {/* Actions */}
          <div className="edit-actions">
            <button className="edit-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "שומר..." : "💾 שמור שינויים"}
            </button>
            <a href={`/recipe/${recipe.id}`} className="edit-cancel-btn">ביטול</a>
          </div>

        </div>
      </div>
    </>
  );
}

const editCss = `
  .edit-wrap { max-width: 680px; margin: 0 auto; padding-bottom: 4rem; }
  .edit-img-section { position: relative; }
  .edit-img-preview { width: 100%; height: 280px; object-fit: cover; display: block; }
  .edit-img-placeholder { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; font-size: 5rem; background: #E8DEC4; }
  .edit-img-actions { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(30,18,8,0.6); padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .edit-img-btn { background: rgba(244,236,216,0.15); color: #F4ECD8; border: 1px solid rgba(244,236,216,0.3); border-radius: 100px; padding: 0.3rem 0.9rem; font-size: 0.8rem; cursor: pointer; font-family: 'Heebo', sans-serif; transition: background 0.2s; }
  .edit-img-btn:hover { background: rgba(244,236,216,0.25); }
  .edit-img-or { color: rgba(244,236,216,0.5); font-size: 0.78rem; }
  .edit-img-url { flex: 1; min-width: 180px; background: rgba(244,236,216,0.1) !important; color: #F4ECD8 !important; border-color: rgba(244,236,216,0.2) !important; font-size: 0.8rem !important; padding: 0.3rem 0.7rem !important; }
  .edit-img-url::placeholder { color: rgba(244,236,216,0.35) !important; }
  .edit-body { padding: 1.75rem 1.5rem 2rem; }
  .edit-field { margin-bottom: 1.25rem; }
  .edit-label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #8C7B68; font-weight: 700; margin-bottom: 0.35rem; }
  .edit-input { width: 100%; padding: 0.55rem 0.85rem; border: 1.5px solid #E8DEC4; border-radius: 8px; font-family: 'Heebo', sans-serif; font-size: 0.95rem; color: #1E1208; background: #FFFDF7; outline: none; transition: border-color 0.2s; direction: rtl; }
  .edit-input:focus { border-color: #B85530; }
  .edit-title-input { font-family: 'Frank Ruhl Libre', serif; font-size: 1.3rem; font-weight: 700; }
  .edit-textarea { resize: vertical; line-height: 1.55; }
  .edit-pills-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
  .edit-field-inline { margin-bottom: 0; flex: 1; min-width: 120px; }
  .edit-select { cursor: pointer; }
  .edit-short { }
  .edit-list-row { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
  .edit-list-input { flex: 1; }
  .edit-step-num { width: 26px; height: 26px; min-width: 26px; border-radius: 50%; background: #B85530; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; margin-top: 0.55rem; flex-shrink: 0; }
  .edit-remove-btn { background: none; border: none; color: #8C7B68; cursor: pointer; font-size: 0.8rem; padding: 0.5rem 0.3rem; margin-top: 0.3rem; transition: color 0.15s; flex-shrink: 0; }
  .edit-remove-btn:hover { color: #B85530; }
  .edit-add-btn { background: none; border: 1.5px dashed #E8DEC4; border-radius: 8px; width: 100%; padding: 0.45rem; color: #8C7B68; font-family: 'Heebo', sans-serif; font-size: 0.85rem; cursor: pointer; transition: border-color 0.2s, color 0.2s; margin-top: 0.25rem; }
  .edit-add-btn:hover { border-color: #B85530; color: #B85530; }
  .edit-error { color: #B85530; font-size: 0.85rem; margin-bottom: 1rem; }
  .edit-actions { display: flex; gap: 0.75rem; align-items: center; margin-top: 2rem; }
  .edit-save-btn { background: #B85530; color: white; border: none; border-radius: 100px; padding: 0.65rem 1.75rem; font-family: 'Heebo', sans-serif; font-size: 0.95rem; cursor: pointer; transition: background 0.2s; }
  .edit-save-btn:hover:not(:disabled) { background: #D4724A; }
  .edit-save-btn:disabled { opacity: 0.5; cursor: default; }
  .edit-cancel-btn { color: #8C7B68; font-size: 0.9rem; text-decoration: none; padding: 0.65rem 0.5rem; }
  .edit-cancel-btn:hover { color: #1E1208; }
`;
