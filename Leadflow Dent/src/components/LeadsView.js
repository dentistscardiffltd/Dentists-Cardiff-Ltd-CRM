import React, { useEffect, useState, useCallback } from "react";
import { theme as t } from "../theme";
import { apiGet, apiPost, driveThumbnail, driveViewUrl } from "../api";
import { LEAD_STATUSES } from "../config";
import Header from "./Header";
import { Card, Badge, Button, Modal, EmptyState, Spinner, Field, Select, Input, Textarea } from "./shared";

const statusColors = { New: t.green, Contacted: t.amber, Booked: t.greenLight, "N/A": t.dim };

function timeAgo(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d)) return "";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function LeadsView({ onConvertedToJob }) {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [converting, setConverting] = useState(false);
  const [filter, setFilter] = useState("New");

  const load = useCallback(() => {
    apiGet("getLeads").then(d => setLeads(d.leads)).catch(e => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (lead, status) => {
    const previousStatus = lead.status;
    // Optimistic update for instant feedback...
    setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, status } : l));
    setSelected(s => s && s.id === lead.id ? { ...s, status } : s);
    try {
      await apiPost("updateLeadStatus", { leadId: lead.id, status });
    } catch (e) {
      // ...but if the save actually failed, undo it and say so — never
      // leave the screen showing a status that isn't really saved.
      setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, status: previousStatus } : l));
      setSelected(s => s && s.id === lead.id ? { ...s, status: previousStatus } : s);
      alert("Couldn't save that change: " + e.message + "\n\nPlease try again.");
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header title="Leads" right={<Button variant="ghost" onClick={load}>↻</Button>} />

      <div style={{ display: "flex", gap: 5, padding: "12px 16px 0" }} className="no-print">
        {LEAD_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            flex: 1, padding: "8px 2px", borderRadius: 10, fontSize: 11, fontWeight: 800,
            border: `1px solid ${filter === s ? t.green : t.border}`,
            background: filter === s ? `${t.green}1a` : "transparent",
            color: filter === s ? t.green : t.muted, cursor: "pointer"
          }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {leads === null && !error && <Spinner />}
        {error && <EmptyState icon="⚠️" title="Couldn't load leads" sub={error} />}
        {leads && leads.filter(l => (l.status || "New") === filter).length === 0 && (
          <EmptyState icon="📥" title={`No ${filter} leads`} sub={filter === "New" ? "New website enquiries will show up here." : undefined} />
        )}
        {leads && leads.filter(l => (l.status || "New") === filter).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {leads.filter(l => (l.status || "New") === filter).map(lead => (
              <Card key={lead.id} onClick={() => setSelected(lead)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{lead.name || "Unnamed lead"}</div>
                    <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
                      {lead.vehicleMakeModel} · {lead.vehicleReg}
                    </div>
                    <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{lead.serviceRequired}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge color={statusColors[lead.status] || t.green}>{lead.status || "New"}</Badge>
                    <div style={{ fontSize: 11, color: t.dim, marginTop: 6 }}>{timeAgo(lead.timestamp)}</div>
                  </div>
                </div>
                {lead.photoIds && lead.photoIds.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {lead.photoIds.slice(0, 4).map(id => (
                      <img key={id} src={driveThumbnail(id, 200)} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: `1px solid ${t.border}` }} />
                    ))}
                    {lead.photoIds.length > 4 && (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: t.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: t.muted }}>
                        +{lead.photoIds.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Modal title="Lead Details" onClose={() => setSelected(null)}>
          <LeadDetail
            lead={selected}
            onStatusChange={(status) => updateStatus(selected, status)}
            onConvert={() => setConverting(true)}
            onDone={() => setSelected(null)}
          />
        </Modal>
      )}

      {converting && selected && (
        <Modal title="Convert to Job" onClose={() => setConverting(false)}>
          <ConvertForm
            lead={selected}
            onDone={(jobId) => {
              // The backend already marks the lead "Booked" as part of
              // converting it — just reflect that locally, no second write.
              setLeads(ls => ls.map(l => l.id === selected.id ? { ...l, status: "Booked" } : l));
              setConverting(false);
              setSelected(null);
              if (onConvertedToJob) onConvertedToJob(jobId);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function LeadDetail({ lead, onStatusChange, onConvert, onDone }) {
  const rows = [
    ["Phone", lead.phone], ["Email", lead.email], ["Location", lead.location],
    ["Vehicle Reg", lead.vehicleReg], ["Make & Model", lead.vehicleMakeModel],
    ["Service Required", lead.serviceRequired], ["Preferred Contact Time", lead.preferredContactTime],
    ["How Found Us", lead.howFoundUs], ["Source", lead.source]
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Field label="Status">
          <Select value={lead.status || "New"} options={LEAD_STATUSES} onChange={e => onStatusChange(e.target.value)} />
        </Field>
      </div>

      <div style={{ background: "#11140d", borderRadius: 10, padding: 4, marginBottom: 16 }}>
        {rows.filter(([, v]) => v).map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
            <span style={{ color: t.muted }}>{label}</span>
            <span style={{ fontWeight: 600, textAlign: "right", marginLeft: 12 }}>{value}</span>
          </div>
        ))}
      </div>

      {lead.damageDescription && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.muted, marginBottom: 6, textTransform: "uppercase" }}>Damage Description</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, background: "#11140d", borderRadius: 10, padding: 12 }}>{lead.damageDescription}</div>
        </div>
      )}

      {lead.photoIds && lead.photoIds.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.muted, marginBottom: 8, textTransform: "uppercase" }}>
            Photos ({lead.photoIds.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {lead.photoIds.map(id => (
              <a key={id} href={driveViewUrl(id)} target="_blank" rel="noreferrer">
                <img src={driveThumbnail(id, 400)} alt="" style={{ width: "100%", aspectRatio: "1", borderRadius: 10, objectFit: "cover", border: `1px solid ${t.border}` }} />
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <Button onClick={onConvert} style={{ flex: 1 }}>🔧 Convert to Job</Button>
        <Button variant="outline" onClick={() => window.open(`tel:${String(lead.phone || "").replace(/\s/g, "")}`)}>📞</Button>
        <Button variant="outline" onClick={() => window.open(`mailto:${String(lead.email || "")}`)}>✉️</Button>
      </div>
      <Button variant="outline" onClick={onDone} style={{ width: "100%", marginTop: 10 }}>✓ Done</Button>
    </div>
  );
}

function ConvertForm({ lead, onDone }) {
  const [jobDate, setJobDate] = useState("");
  const [jobTime, setJobTime] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await apiPost("convertLeadToJob", { leadId: lead.id, jobDate, jobTime, price, notes });
      onDone(res.jobId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Field label="Job Date">
        <Input type="date" value={jobDate} onChange={e => setJobDate(e.target.value)} />
      </Field>
      <Field label="Job Time">
        <Input type="time" value={jobTime} onChange={e => setJobTime(e.target.value)} />
      </Field>
      <Field label="Quoted Price (£)">
        <Input type="number" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 120" />
      </Field>
      <Field label="Notes">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything the technician should know" />
      </Field>
      {err && <div style={{ color: t.red, fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <Button onClick={submit} disabled={saving} style={{ width: "100%" }}>
        {saving ? "Creating Job…" : "Create Job"}
      </Button>
    </div>
  );
}
