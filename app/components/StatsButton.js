"use client";
import { useState } from "react";

export default function StatsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="stats-btn"
        title="סטטיסטיקות"
      >
        📊
      </button>

      {open && (
        <div className="stats-overlay" onClick={() => setOpen(false)}>
          <div className="stats-modal" onClick={e => e.stopPropagation()}>
            <button className="stats-close" onClick={() => setOpen(false)}>✕</button>
            <p className="stats-title">סטטיסטיקות</p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .stats-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0.3rem 0.4rem; opacity: 0.45; transition: opacity 0.2s; line-height: 1; }
        .stats-btn:hover { opacity: 1; }
        .stats-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .stats-modal { background: #FAF6EE; border-radius: 18px; padding: 2rem 2.5rem; min-width: 300px; min-height: 200px; position: relative; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .stats-close { position: absolute; top: 0.75rem; left: 0.75rem; background: none; border: none; cursor: pointer; font-size: 1rem; color: #8C7B68; opacity: 0.6; }
        .stats-close:hover { opacity: 1; }
        .stats-title { font-family: 'Frank Ruhl Libre', serif; font-size: 1.15rem; font-weight: 700; color: #1E1208; }
      ` }} />
    </>
  );
}
