import React, { useState } from "react";
import { theme as t } from "../theme";
import { APP_PIN, BUSINESS } from "../config";

export default function PinLock({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const go = (digit) => {
    if (pin.length >= 6) return;
    const next = pin + digit;
    setPin(next);
    setError(false);
    if (next.length === 6) {
      if (next === APP_PIN) {
        sessionStorage.setItem("dc-crm-unlocked", "1");
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => { setShake(false); setPin(""); }, 400);
      }
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: t.dark, padding: 24
    }}>
      <img src="/logo.png" alt="" style={{ width: 90, height: 90, objectFit: "contain", marginBottom: 16 }} />
      <div style={{ fontFamily: t.displayFont, fontSize: 20, fontWeight: 800, color: t.green, marginBottom: 4 }}>
        Dent-ists Cardiff
      </div>
      <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 40 }}>
        Enter PIN to continue
      </div>
      <div style={{
        display: "flex", gap: 12, marginBottom: 10,
        animation: shake ? "shake .4s ease" : "none"
      }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: "50%",
            background: i < pin.length ? (error ? t.red : t.green) : "transparent",
            border: `2px solid ${i < pin.length ? (error ? t.red : t.green) : "#333"}`,
            transition: "all .15s"
          }} />
        ))}
      </div>
      <div style={{ height: 20, marginBottom: 8, fontSize: 12, color: t.red, fontWeight: 700 }}>
        {error ? "Wrong PIN" : ""}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, maxWidth: 260, width: "100%" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => {
          if (k === "") return <div key={i} />;
          return (
            <button key={i}
              onClick={() => k === "⌫" ? setPin(p => p.slice(0, -1)) : go(String(k))}
              style={{
                width: "100%", aspectRatio: "1.3", borderRadius: 14,
                border: `1px solid ${t.border}`, background: k === "⌫" ? "transparent" : t.card,
                color: t.text, fontSize: k === "⌫" ? 22 : 24, fontWeight: 600,
                fontFamily: t.bodyFont, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
              {k}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 30, fontSize: 11, color: t.dim }}>{BUSINESS.tradingName} CRM</div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-8px);} 75%{transform:translateX(8px);} }`}</style>
    </div>
  );
}
