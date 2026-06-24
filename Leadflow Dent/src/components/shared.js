import React from "react";
import { theme as t } from "../theme";

export function Card({ children, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 14,
        padding: 16,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color .15s",
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function Badge({ children, color }) {
  const c = color || t.green;
  return (
    <span style={{
      display: "inline-block",
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 0.3,
      textTransform: "uppercase",
      color: c,
      background: `${c}1a`,
      border: `1px solid ${c}4d`,
      borderRadius: 20,
      padding: "3px 10px"
    }}>
      {children}
    </span>
  );
}

export function Button({ children, onClick, variant = "primary", style, disabled, type = "button" }) {
  const base = {
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14,
    padding: "11px 18px",
    fontFamily: t.displayFont,
    transition: "all .15s",
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer"
  };
  const variants = {
    primary: { background: t.green, color: "#0d0f0a" },
    outline: { background: "transparent", color: t.text, border: `1px solid ${t.border}` },
    danger: { background: "transparent", color: t.red, border: `1px solid ${t.red}66` },
    ghost: { background: "transparent", color: t.muted, padding: "8px 10px" }
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: t.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "#11140d",
  border: `1px solid ${t.border}`,
  borderRadius: 8,
  color: t.text,
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: t.bodyFont
};

export function Input(props) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function Select({ options, ...props }) {
  return (
    <select {...props} style={{ ...inputStyle, ...props.style }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function Textarea(props) {
  return <textarea {...props} rows={props.rows || 3} style={{ ...inputStyle, resize: "vertical", ...props.style }} />;
}

export function Modal({ children, onClose, title, wide }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: t.dark, borderTop: `1px solid ${t.border}`,
        borderRadius: "18px 18px 0 0", width: "100%", maxWidth: wide ? 720 : 480,
        maxHeight: "92vh", overflowY: "auto", overscrollBehavior: "contain", padding: "20px 18px 28px",
        animation: "slideUp .2s ease"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontFamily: t.displayFont, fontSize: 18, fontWeight: 800, color: t.green, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

export function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: t.muted }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: t.text, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: 40, color: t.muted }}>
      <div style={{
        width: 28, height: 28, margin: "0 auto 10px", borderRadius: "50%",
        border: `3px solid ${t.border}`, borderTopColor: t.green,
        animation: "spin .7s linear infinite"
      }} />
      Loading…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
