"use client";
import { useState, useEffect, useRef } from "react";

// btoa("1978") — mild obfuscation for client-side PIN
const PIN_ENC = "MTk3OA==";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const check = () => setIsAdmin(localStorage.getItem("admin_mode") === "yes");
    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);
  return isAdmin;
}

export default function AdminLock() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [shake, setShake] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    setIsAdmin(localStorage.getItem("admin_mode") === "yes");
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRefs[0].current?.focus(), 50);
  }, [open]);

  const pin = digits.join("");

  function handleDigit(i, val) {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 3) inputRefs[i + 1].current?.focus();
    if (next.every(Boolean) && next.join("").length === 4) {
      setTimeout(() => submit(next.join("")), 50);
    }
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs[i - 1].current?.focus();
    }
    if (e.key === "Enter" && pin.length === 4) submit(pin);
  }

  function submit(code = pin) {
    if (btoa(code) === PIN_ENC) {
      localStorage.setItem("admin_mode", "yes");
      window.dispatchEvent(new Event("storage"));
      setIsAdmin(true);
      setOpen(false);
      setDigits(["", "", "", ""]);
    } else {
      setShake(true);
      setDigits(["", "", "", ""]);
      setTimeout(() => { setShake(false); inputRefs[0].current?.focus(); }, 500);
    }
  }

  function handleLock() {
    localStorage.removeItem("admin_mode");
    window.dispatchEvent(new Event("storage"));
    setIsAdmin(false);
  }

  function handleClose() {
    setOpen(false);
    setDigits(["", "", "", ""]);
  }

  return (
    <>
      <button
        onClick={isAdmin ? handleLock : () => setOpen(true)}
        className="admin-lock-btn"
        title={isAdmin ? "נעל מצב מנהל" : "כניסת מנהל"}
      >
        {isAdmin ? "🔓" : "🔒"}
      </button>

      {open && (
        <div className="admin-overlay" onClick={handleClose}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <p className="admin-modal-title">כניסת מנהל</p>
            <div className={`admin-pin-row${shake ? " admin-pin-shake" : ""}`}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="admin-pin-box"
                  dir="ltr"
                />
              ))}
            </div>
            <button className="admin-submit-btn" onClick={() => submit()} disabled={pin.length !== 4}>
              כניסה
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-lock-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0.3rem 0.4rem; opacity: 0.45; transition: opacity 0.2s; line-height: 1; }
        .admin-lock-btn:hover { opacity: 1; }
        .admin-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .admin-modal { background: #FAF6EE; border-radius: 18px; padding: 2rem 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .admin-modal-title { font-family: 'Frank Ruhl Libre', serif; font-size: 1.15rem; font-weight: 700; color: #1E1208; }
        .admin-pin-row { display: flex; gap: 0.6rem; direction: ltr; }
        .admin-pin-box { width: 48px; height: 56px; text-align: center; font-size: 1.6rem; border: 2px solid #E8DEC4; border-radius: 10px; outline: none; background: white; transition: border-color 0.2s; caret-color: #B85530; }
        .admin-pin-box:focus { border-color: #B85530; }
        @keyframes admin-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .admin-pin-shake { animation: admin-shake 0.4s ease; }
        .admin-submit-btn { background: #B85530; color: white; border: none; border-radius: 100px; padding: 0.55rem 1.75rem; font-family: 'Heebo', sans-serif; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
        .admin-submit-btn:hover:not(:disabled) { background: #D4724A; }
        .admin-submit-btn:disabled { opacity: 0.45; cursor: default; }
      ` }} />
    </>
  );
}
