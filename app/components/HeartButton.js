"use client";
import { useState, useEffect } from "react";

export default function HeartButton({ id }) {
  const [hearted, setHearted] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("hearted_recipes") || "[]");
    setHearted(saved.includes(id));
  }, [id]);

  function toggle() {
    const saved = JSON.parse(localStorage.getItem("hearted_recipes") || "[]");
    const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
    localStorage.setItem("hearted_recipes", JSON.stringify(next));
    setHearted(!hearted);
  }

  return (
    <>
      <button className="recipe-heart-btn" onClick={toggle} title={hearted ? "הסר לייק" : "אהבתי"}>
        <span className={hearted ? "heart-lit" : "heart-unlit"}>{hearted ? "❤️" : "♡"}</span>
      </button>
      <style dangerouslySetInnerHTML={{ __html: `
        .recipe-heart-btn { background: rgba(244,236,216,0.92); border: 1px solid #b6aa8a; border-radius: 8px; width: 34px; height: 34px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s, transform 0.15s; }
        .recipe-heart-btn:hover { background: #F4ECD8; transform: scale(1.15); }
        .recipe-heart-btn:hover .heart-unlit { opacity: 0.7; }
        .heart-unlit { opacity: 0.5; color: #B85530; font-size: 1.1rem; transition: opacity 0.2s; }
      ` }} />
    </>
  );
}
