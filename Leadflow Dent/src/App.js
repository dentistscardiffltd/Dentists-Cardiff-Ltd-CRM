import React, { useState, useEffect } from "react";
import PinLock from "./components/PinLock";
import Nav from "./components/Nav";
import LeadsView from "./components/LeadsView";
import JobsView from "./components/JobsView";
import CalendarView from "./components/CalendarView";
import InvoicesView from "./components/InvoicesView";

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [view, setView] = useState("leads");
  const [prefillJob, setPrefillJob] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem("dc-crm-unlocked") === "1") setUnlocked(true);
  }, []);

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={{ minHeight: "100vh" }}>
      {view === "leads" && <LeadsView onConvertedToJob={() => setView("jobs")} />}
      {view === "jobs" && <JobsView onCreateInvoice={(job) => { setPrefillJob(job); setView("invoices"); }} />}
      {view === "calendar" && <CalendarView />}
      {view === "invoices" && (
        <InvoicesView prefillJob={prefillJob} clearPrefill={() => setPrefillJob(null)} />
      )}
      <Nav view={view} setView={setView} />
    </div>
  );
}
