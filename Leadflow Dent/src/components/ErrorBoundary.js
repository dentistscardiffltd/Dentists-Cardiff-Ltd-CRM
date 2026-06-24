import React from "react";
import { theme as t } from "../theme";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("CRM crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: t.dark,
          color: t.text, padding: 24, textAlign: "center"
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
          <div style={{ fontFamily: t.displayFont, fontWeight: 800, fontSize: 18, marginBottom: 8, color: t.red }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 13, color: t.muted, marginBottom: 20, maxWidth: 320 }}>
            {this.state.error.message || String(this.state.error)}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{
              background: t.green, color: "#0d0f0a", border: "none", borderRadius: 10,
              padding: "10px 20px", fontWeight: 800, fontFamily: t.displayFont, cursor: "pointer"
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
