import React from "react";
import { theme as t } from "../theme";

const TABS = [
  { id: "leads", label: "Leads", icon: "📥" },
  { id: "jobs", label: "Jobs", icon: "🔧" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "invoices", label: "Invoices", icon: "🧾" }
];

export default function Nav({ view, setView }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      display: "flex", background: "rgba(13,15,10,.98)",
      borderTop: `1px solid ${t.border}`, backdropFilter: "blur(8px)",
      paddingBottom: "env(safe-area-inset-bottom)", zIndex: 50
    }} className="no-print">
      {TABS.map(tab => {
        const active = view === tab.id;
        return (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 2, padding: "10px 0", position: "relative"
          }}>
            <span style={{ fontSize: 20, opacity: active ? 1 : 0.5 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, color: active ? t.green : t.muted }}>
              {tab.label}
            </span>
            {active && <div style={{
              position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
              width: 28, height: 3, borderRadius: "3px 3px 0 0", background: t.green
            }} />}
          </button>
        );
      })}
    </nav>
  );
}
