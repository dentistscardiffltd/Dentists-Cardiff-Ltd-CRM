import React, { useEffect, useState, useCallback } from "react";
import { theme as t } from "../theme";
import { apiGet, apiPost, driveThumbnail } from "../api";
import { JOB_STATUSES } from "../config";
import Header from "./Header";
import { Card, Badge, Button, Modal, EmptyState, Spinner, Field, Select, Input, Textarea } from "./shared";

const statusColors = {
  Booked: t.amber, "In Progress": t.green, Completed: t.green,
  Invoiced: t.muted, Cancelled: t.red
};

function fmtDate(d) {
  if (!d) return "No date set";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
}

export default function JobsView({ onCreateInvoice }) {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    apiGet("getJobs").then(d => setJobs(d.jobs)).catch(e => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header title="Jobs" right={
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" onClick={load}>↻</Button>
          <Button onClick={() => setAdding(true)}>+ Add</Button>
        </div>
      } />
      <div style={{ padding: 16 }}>
        {jobs === null && !error && <Spinner />}
        {error && <EmptyState icon="⚠️" title="Couldn't load jobs" sub={error} />}
        {jobs && jobs.length === 0 && <EmptyState icon="🔧" title="No jobs yet" sub="Convert a lead, or add one manually." />}
        {jobs && jobs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {jobs.map(job => (
              <Card key={job.id} onClick={() => setSelected(job)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{job.clientName || "Unnamed client"}</div>
                    <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{job.vehicleMakeModel} · {job.vehicleReg}</div>
                    <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{fmtDate(job.jobDate)}{job.jobTime ? ` · ${job.jobTime}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge color={statusColors[job.status] || t.green}>{job.status || "Booked"}</Badge>
                    {job.price && <div style={{ fontSize: 13, fontWeight: 800, color: t.green, marginTop: 6 }}>£{job.price}</div>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Modal title="Job Details" onClose={() => setSelected(null)} wide>
          <JobDetail
            job={selected}
            onUpdated={(patch) => {
              setJobs(js => js.map(j => j.id === selected.id ? { ...j, ...patch } : j));
              setSelected(s => ({ ...s, ...patch }));
            }}
            onDeleted={() => { setJobs(js => js.filter(j => j.id !== selected.id)); setSelected(null); }}
            onCreateInvoice={() => { onCreateInvoice(selected); setSelected(null); }}
          />
        </Modal>
      )}

      {adding && (
        <Modal title="Add Job" onClose={() => setAdding(false)}>
          <AddJobForm onAdded={(job) => { setAdding(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function JobDetail({ job, onUpdated, onDeleted, onCreateInvoice }) {
  const [status, setStatus] = useState(job.status || "Booked");
  const [price, setPrice] = useState(job.price || "");
  const [notes, setNotes] = useState(job.notes || "");
  const [jobDate, setJobDate] = useState(job.jobDate ? job.jobDate.toString().slice(0, 10) : "");
  const [jobTime, setJobTime] = useState(job.jobTime || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiPost("updateJob", { jobId: job.id, status, price, notes, jobDate, jobTime });
      onUpdated({ status, price, notes, jobDate, jobTime });
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!window.confirm("Delete this job? This can't be undone.")) return;
    try {
      await apiPost("deleteJob", { jobId: job.id });
      onDeleted();
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div style={{ fontSize: 14, color: t.muted, marginBottom: 14 }}>
        {job.clientName} · {job.phone} · {job.vehicleMakeModel} ({job.vehicleReg})
      </div>

      {job.photoIds && job.photoIds.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {job.photoIds.map(id => (
            <img key={id} src={driveThumbnail(id, 200)} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: `1px solid ${t.border}` }} />
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Status">
          <Select value={status} options={JOB_STATUSES} onChange={e => setStatus(e.target.value)} />
        </Field>
        <Field label="Price (£)">
          <Input type="number" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} />
        </Field>
        <Field label="Job Date">
          <Input type="date" value={jobDate} onChange={e => setJobDate(e.target.value)} />
        </Field>
        <Field label="Job Time">
          <Input type="time" value={jobTime} onChange={e => setJobTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
        <Button onClick={save} disabled={saving} style={{ flex: 1 }}>{saving ? "Saving…" : "Save Changes"}</Button>
        <Button variant="outline" onClick={onCreateInvoice}>🧾 Invoice</Button>
        <Button variant="danger" onClick={remove}>Delete</Button>
      </div>
    </div>
  );
}

function AddJobForm({ onAdded }) {
  const [form, setForm] = useState({
    clientName: "", phone: "", email: "", location: "", vehicleReg: "",
    vehicleMakeModel: "", service: "", jobDate: "", jobTime: "", price: "", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.clientName.trim()) { alert("Client name is required"); return; }
    setSaving(true);
    try {
      const res = await apiPost("createJob", form);
      onAdded(res.jobId);
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <div>
      <Field label="Client Name *"><Input value={form.clientName} onChange={set("clientName")} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Phone"><Input value={form.phone} onChange={set("phone")} /></Field>
        <Field label="Email"><Input value={form.email} onChange={set("email")} /></Field>
      </div>
      <Field label="Location"><Input value={form.location} onChange={set("location")} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Vehicle Reg"><Input value={form.vehicleReg} onChange={set("vehicleReg")} /></Field>
        <Field label="Make & Model"><Input value={form.vehicleMakeModel} onChange={set("vehicleMakeModel")} /></Field>
      </div>
      <Field label="Service"><Input value={form.service} onChange={set("service")} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Job Date"><Input type="date" value={form.jobDate} onChange={set("jobDate")} /></Field>
        <Field label="Job Time"><Input type="time" value={form.jobTime} onChange={set("jobTime")} /></Field>
      </div>
      <Field label="Price (£)"><Input type="number" inputMode="decimal" value={form.price} onChange={set("price")} /></Field>
      <Field label="Notes"><Textarea value={form.notes} onChange={set("notes")} /></Field>
      <Button onClick={submit} disabled={saving} style={{ width: "100%" }}>{saving ? "Adding…" : "Add Job"}</Button>
    </div>
  );
}
