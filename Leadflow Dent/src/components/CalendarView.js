import React, { useEffect, useState, useCallback, useMemo } from "react";
import { theme as t } from "../theme";
import { apiGet } from "../api";
import Header from "./Header";
import { Badge, Button, Modal, EmptyState, Spinner } from "./shared";

const statusColors = {
  Booked: t.amber, "In Progress": t.green, Completed: t.green,
  Invoiced: t.muted, Cancelled: t.red
};

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

export default function CalendarView() {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("month"); // month | list
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const load = useCallback(() => {
    apiGet("getJobs").then(d => setJobs(d.jobs)).catch(e => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const jobsByDay = useMemo(() => {
    const map = {};
    (jobs || []).forEach(j => {
      if (!j.jobDate) return;
      const key = j.jobDate.toString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(j);
    });
    return map;
  }, [jobs]);

  const upcoming = useMemo(() => {
    if (!jobs) return [];
    const today = ymd(new Date());
    return jobs
      .filter(j => j.jobDate && j.jobDate.toString().slice(0, 10) >= today)
      .sort((a, b) => a.jobDate.toString().localeCompare(b.jobDate.toString()));
  }, [jobs]);

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header title="Calendar" right={
        <div style={{ display: "flex", gap: 6 }}>
          <Button variant={mode === "month" ? "primary" : "outline"} onClick={() => setMode("month")} style={{ padding: "7px 12px", fontSize: 12 }}>Month</Button>
          <Button variant={mode === "list" ? "primary" : "outline"} onClick={() => setMode("list")} style={{ padding: "7px 12px", fontSize: 12 }}>List</Button>
        </div>
      } />

      <div style={{ padding: 16 }}>
        {jobs === null && !error && <Spinner />}
        {error && <EmptyState icon="⚠️" title="Couldn't load calendar" sub={error} />}

        {jobs && mode === "month" && (
          <MonthGrid cursor={cursor} setCursor={setCursor} jobsByDay={jobsByDay} onSelectDay={setSelectedDay} />
        )}

        {jobs && mode === "list" && (
          upcoming.length === 0
            ? <EmptyState icon="📅" title="No upcoming jobs" />
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcoming.map(job => <JobRow key={job.id} job={job} />)}
              </div>
            )
        )}
      </div>

      {selectedDay && (
        <Modal title={new Date(selectedDay).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} onClose={() => setSelectedDay(null)}>
          {(jobsByDay[selectedDay] || []).length === 0
            ? <EmptyState icon="📅" title="No jobs this day" />
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {jobsByDay[selectedDay].map(job => <JobRow key={job.id} job={job} />)}
              </div>}
        </Modal>
      )}
    </div>
  );
}

function JobRow({ job }) {
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{job.clientName}</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{job.vehicleMakeModel} · {job.vehicleReg}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Badge color={statusColors[job.status] || t.green}>{job.status}</Badge>
          {job.jobTime && <div style={{ fontSize: 12, color: t.muted, marginTop: 6 }}>{job.jobTime}</div>}
        </div>
      </div>
    </div>
  );
}

function MonthGrid({ cursor, setCursor, jobsByDay, onSelectDay }) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = ymd(new Date());

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Button variant="ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</Button>
        <div style={{ fontWeight: 800, fontFamily: t.displayFont, fontSize: 16 }}>
          {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </div>
        <Button variant="ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11, color: t.dim, fontWeight: 700 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = ymd(new Date(year, month, d));
          const dayJobs = jobsByDay[key] || [];
          const isToday = key === todayKey;
          return (
            <button key={i} onClick={() => dayJobs.length && onSelectDay(key)} style={{
              aspectRatio: "1", borderRadius: 10, border: `1px solid ${isToday ? t.green : t.border}`,
              background: dayJobs.length ? "#11140d" : "transparent", color: t.text,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: dayJobs.length ? "pointer" : "default", padding: 2
            }}>
              <span style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? t.green : t.text }}>{d}</span>
              {dayJobs.length > 0 && (
                <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                  {dayJobs.slice(0, 3).map((j, idx) => (
                    <span key={idx} style={{ width: 5, height: 5, borderRadius: "50%", background: statusColors[j.status] || t.green }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
