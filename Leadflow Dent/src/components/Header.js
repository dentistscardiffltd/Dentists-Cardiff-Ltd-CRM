import React from "react";
import { theme as t } from "../theme";

export default function Header({ title, right }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 40, background: "rgba(13,15,10,.98)",
      borderBottom: `1px solid ${t.border}`, backdropFilter: "blur(8px)",
      padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between"
    }} className="no-print">
      <h1 style={{ fontFamily: t.displayFont, fontSize: 20, fontWeight: 800, color: t.green, margin: 0 }}>
        {title}
      </h1>
      <div>{right}</div>
    </div>
  );
}
