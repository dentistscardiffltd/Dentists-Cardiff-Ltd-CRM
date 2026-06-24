import React, { useEffect, useState, useCallback, useRef } from "react";
import { theme as t } from "../theme";
import { apiGet, apiPost } from "../api";
import { BUSINESS, INVOICE_STATUSES, SERVICE_PRESETS } from "../config";
import { downloadElementAsPdf } from "../pdfExport";
import Header from "./Header";
import { Card, Badge, Button, Modal, EmptyState, Spinner, Field, Select, Input, Textarea } from "./shared";

const statusColors = { Draft: t.muted, Sent: t.amber, Paid: t.green };
const DRAFT_KEY = "dc-crm-invoice-draft";

export default function InvoicesView({ prefillJob, clearPrefill }) {
  const [invoices, setInvoices] = useState(null);
  const [error, setError] = useState(null);
  const [building, setBuilding] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(() => {
    apiGet("getInvoices").then(d => setInvoices(d.invoices)).catch(e => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (prefillJob) setBuilding(true);
  }, [prefillJob]);

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header title="Invoices" right={
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" onClick={load}>↻</Button>
          <Button onClick={() => setBuilding(true)}>+ New</Button>
        </div>
      } />

      <div style={{ padding: 16 }}>
        {invoices === null && !error && <Spinner />}
        {error && <EmptyState icon="⚠️" title="Couldn't load invoices" sub={error} />}
        {invoices && invoices.length === 0 && <EmptyState icon="🧾" title="No invoices yet" />}
        {invoices && invoices.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invoices.map(inv => (
              <Card key={inv.id} onClick={() => setViewing(inv)}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{inv.invoiceNumber}</div>
                    <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{inv.clientName}</div>
                    <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{inv.issueDate}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge color={statusColors[inv.status] || t.muted}>{inv.status}</Badge>
                    <div style={{ fontSize: 15, fontWeight: 800, color: t.green, marginTop: 6 }}>£{inv.total}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {building && (
        <Modal title="New Invoice" onClose={() => { setBuilding(false); clearPrefill && clearPrefill(); }} wide>
          <InvoiceBuilder
            prefillJob={prefillJob}
            onCreated={() => { setBuilding(false); clearPrefill && clearPrefill(); load(); }}
          />
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.invoiceNumber} onClose={() => setViewing(null)} wide>
          <InvoicePreview
            invoice={viewing}
            onStatusChange={async (status) => {
              await apiPost("updateInvoiceStatus", { invoiceId: viewing.id, status });
              setViewing(v => ({ ...v, status }));
              setInvoices(list => list.map(i => i.id === viewing.id ? { ...i, status } : i));
            }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════ LEAD SEARCH / AUTOFILL ═══════════════════ */
function LeadSearch({ onPick }) {
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    apiGet("getLeads").then(d => setLeads(d.leads)).catch(() => setLeads([]));
  }, []);

  const matches = (leads || []).filter(l => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return false;
    return (l.name || "").toLowerCase().includes(q)
      || (l.vehicleReg || "").toLowerCase().includes(q)
      || (l.phone || "").toLowerCase().includes(q);
  }).slice(0, 6);

  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <Field label="Search a Lead to Autofill">
        <Input
          placeholder="Type a name, reg, or phone number…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </Field>
      {open && String(query || "").trim() && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          background: "#11140d", border: `1px solid ${t.border}`, borderRadius: 10,
          maxHeight: 240, overflowY: "auto", marginTop: -10
        }}>
          {leads === null && <div style={{ padding: 12, fontSize: 13, color: t.muted }}>Searching…</div>}
          {leads && matches.length === 0 && <div style={{ padding: 12, fontSize: 13, color: t.muted }}>No matching leads</div>}
          {matches.map(l => (
            <div key={l.id}
              onClick={() => { onPick(l); setQuery(l.name || ""); setOpen(false); }}
              style={{ padding: "10px 12px", borderBottom: `1px solid ${t.border}`, cursor: "pointer" }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{l.name}</div>
              <div style={{ fontSize: 12, color: t.muted }}>{l.vehicleMakeModel} · {l.vehicleReg} · {l.phone}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ LINE ITEMS ═══════════════════ */
function LineItemRow({ item, onChange, onRemove }) {
  const setPreset = (label) => {
    const preset = SERVICE_PRESETS.find(p => p.label === label);
    onChange({ ...item, description: label === "Custom item" ? "" : label, price: preset.price });
  };

  return (
    <div style={{ background: "#11140d", border: `1px solid ${t.border}`, borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <Select
          options={SERVICE_PRESETS.map(p => p.label)}
          value={SERVICE_PRESETS.find(p => p.label === item.description) ? item.description : "Custom item"}
          onChange={e => setPreset(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={onRemove} style={{ background: "none", border: "none", color: t.red, fontSize: 16, cursor: "pointer", padding: "0 6px" }}>✕</button>
      </div>
      <Input
        placeholder="Description shown on invoice"
        value={item.description}
        onChange={e => onChange({ ...item, description: e.target.value })}
        style={{ marginBottom: 8 }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: t.dim, marginBottom: 3 }}>QTY</div>
          <Input type="number" value={item.qty} onChange={e => onChange({ ...item, qty: e.target.value })} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: t.dim, marginBottom: 3 }}>UNIT PRICE £</div>
          <Input type="number" inputMode="decimal" value={item.price} onChange={e => onChange({ ...item, price: e.target.value })} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: t.dim, marginBottom: 3 }}>LINE TOTAL</div>
          <div style={{ fontWeight: 800, color: t.green, paddingTop: 8 }}>
            £{((Number(item.qty) || 0) * (Number(item.price) || 0)).toFixed(2)}
          </div>
        </div>
      </div>
      <Input
        placeholder="Notes for this item (optional, e.g. part number)"
        value={item.notes || ""}
        onChange={e => onChange({ ...item, notes: e.target.value })}
        style={{ marginTop: 8, fontSize: 12 }}
      />
    </div>
  );
}

const blankForm = () => ({
  clientName: "", clientEmail: "", clientAddress: "", vehicleReg: "",
  lineItems: [{ description: "", qty: 1, price: "", notes: "" }],
  paymentMethods: BUSINESS.paymentMethods, notes: "", jobId: ""
});

function InvoiceBuilder({ prefillJob, onCreated }) {
  const [form, setForm] = useState(() => {
    if (prefillJob) {
      return {
        clientName: prefillJob.clientName || "",
        clientEmail: prefillJob.email || "",
        clientAddress: prefillJob.location || "",
        vehicleReg: prefillJob.vehicleReg || "",
        lineItems: prefillJob.service
          ? [{ description: prefillJob.service, qty: 1, price: prefillJob.price || "", notes: "" }]
          : [{ description: "", qty: 1, price: "", notes: "" }],
        paymentMethods: BUSINESS.paymentMethods, notes: "", jobId: prefillJob.id || ""
      };
    }
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore corrupt draft */ }
    return blankForm();
  });
  const [saving, setSaving] = useState(false);
  const firstRender = useRef(true);

  // Autosave the draft as the user types, so backing out doesn't lose it.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch (e) { /* storage full/unavailable */ }
  }, [form]);

  const total = form.lineItems.reduce((sum, li) => sum + (Number(li.qty) || 0) * (Number(li.price) || 0), 0);

  const updateItem = (idx, item) => setForm(f => ({ ...f, lineItems: f.lineItems.map((it, i) => i === idx ? item : it) }));
  const addItem = () => setForm(f => ({ ...f, lineItems: [...f.lineItems, { description: "", qty: 1, price: "", notes: "" }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }));
  const togglePayment = (method) => setForm(f => ({
    ...f, paymentMethods: f.paymentMethods.includes(method) ? f.paymentMethods.filter(m => m !== method) : [...f.paymentMethods, method]
  }));

  const fillFromLead = (lead) => {
    setForm(f => {
      const firstItem = f.lineItems[0];
      const shouldFillFirstItem = Boolean(lead.serviceRequired) && firstItem && !firstItem.description;
      return {
        ...f,
        clientName: lead.name || f.clientName,
        clientEmail: lead.email || f.clientEmail,
        clientAddress: lead.location || f.clientAddress,
        vehicleReg: lead.vehicleReg || f.vehicleReg,
        lineItems: shouldFillFirstItem
          ? [{ description: lead.serviceRequired, qty: 1, price: "", notes: "" }, ...f.lineItems.slice(1)]
          : (f.lineItems.length > 0 ? f.lineItems : [{ description: "", qty: 1, price: "", notes: "" }])
      };
    });
  };

  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} };

  const submit = async () => {
    if (!form.clientName.trim()) { alert("Client name is required"); return; }
    setSaving(true);
    try {
      await apiPost("createInvoice", {
        jobId: form.jobId,
        clientName: form.clientName, clientEmail: form.clientEmail,
        clientAddress: form.clientAddress, vehicleReg: form.vehicleReg,
        lineItems: form.lineItems.filter(li => li.description.trim()),
        paymentMethods: form.paymentMethods, notes: form.notes
      });
      clearDraft();
      onCreated();
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <div>
      {!prefillJob && <LeadSearch onPick={fillFromLead} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Client Name *"><Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} /></Field>
        <Field label="Client Email"><Input value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} /></Field>
      </div>
      <Field label="Client Address"><Input value={form.clientAddress} onChange={e => setForm(f => ({ ...f, clientAddress: e.target.value }))} /></Field>
      <Field label="Vehicle Reg"><Input value={form.vehicleReg} onChange={e => setForm(f => ({ ...f, vehicleReg: e.target.value }))} /></Field>

      <div style={{ fontSize: 12, fontWeight: 700, color: t.muted, textTransform: "uppercase", marginBottom: 8, marginTop: 4 }}>Line Items</div>
      {form.lineItems.map((li, idx) => (
        <LineItemRow key={idx} item={li} onChange={(item) => updateItem(idx, item)} onRemove={() => removeItem(idx)} />
      ))}
      <Button variant="outline" onClick={addItem} style={{ marginBottom: 16, width: "100%" }}>+ Add Line Item</Button>

      <div style={{ textAlign: "right", fontSize: 18, fontWeight: 800, color: t.green, marginBottom: 16 }}>
        Total: £{total.toFixed(2)}
      </div>

      <Field label="Payment Methods">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Card", "Cash", "Bank Transfer"].map(method => (
            <button key={method} onClick={() => togglePayment(method)} style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: `1px solid ${form.paymentMethods.includes(method) ? t.green : t.border}`,
              background: form.paymentMethods.includes(method) ? `${t.green}1a` : "transparent",
              color: form.paymentMethods.includes(method) ? t.green : t.muted, cursor: "pointer"
            }}>{method}</button>
          ))}
        </div>
      </Field>

      <Field label="Notes"><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>

      <div style={{ fontSize: 11, color: t.dim, marginBottom: 10 }}>
        This draft saves automatically — safe to back out and come back later.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="outline" onClick={() => { clearDraft(); setForm(blankForm()); }} style={{ flex: "0 0 auto" }}>Clear Draft</Button>
        <Button onClick={submit} disabled={saving} style={{ flex: 1 }}>{saving ? "Saving…" : "Save Invoice"}</Button>
      </div>
    </div>
  );
}

/* ═══════════════════ PREVIEW / PDF / EMAIL ═══════════════════ */
function InvoicePreview({ invoice, onStatusChange }) {
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await apiPost("sendInvoiceEmail", { invoiceId: invoice.id });
      onStatusChange("Sent");
      alert("Invoice emailed to " + invoice.clientEmail);
    } catch (e) { alert(e.message); } finally { setSending(false); }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await downloadElementAsPdf("invoice-printable", `${invoice.invoiceNumber}.pdf`);
    } catch (e) { alert("Couldn't generate PDF: " + e.message); } finally { setDownloading(false); }
  };

  return (
    <div>
      <div id="invoice-printable" style={{ background: "#fff", color: "#222", borderRadius: 10, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <h2 style={{ color: "#3f7d2c", margin: "0 0 2px", fontSize: 24 }}>Invoice {invoice.invoiceNumber}</h2>
            <div style={{ color: "#666", fontSize: 13 }}>{BUSINESS.tradingName} · {BUSINESS.legalName}</div>
            <div style={{ color: "#666", fontSize: 12 }}>{BUSINESS.address}</div>
            <div style={{ color: "#666", fontSize: 12 }}>Company Reg {BUSINESS.regNumber}</div>
          </div>
          <img src="/logo.png" alt="" style={{ width: 56, height: 56, objectFit: "contain" }} />
        </div>
        <hr style={{ border: "none", borderTop: "2px solid #3f7d2c", margin: "14px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 14 }}>
          <div><strong>Bill To:</strong><br />{invoice.clientName}<br />{invoice.clientAddress}</div>
          <div style={{ textAlign: "right" }}><strong>Date:</strong> {invoice.issueDate}<br /><strong>Vehicle:</strong> {invoice.vehicleReg}</div>
        </div>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f5f5f5" }}>
            <th style={{ textAlign: "left", padding: 6 }}>Description</th>
            <th style={{ padding: 6 }}>Qty</th>
            <th style={{ textAlign: "right", padding: 6 }}>Price</th>
            <th style={{ textAlign: "right", padding: 6 }}>Total</th>
          </tr></thead>
          <tbody>
            {(invoice.lineItems || []).map((li, idx) => (
              <tr key={idx}>
                <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>
                  {li.description}
                  {li.notes && <div style={{ fontSize: 11, color: "#999" }}>{li.notes}</div>}
                </td>
                <td style={{ padding: 6, borderBottom: "1px solid #eee", textAlign: "center" }}>{li.qty}</td>
                <td style={{ padding: 6, borderBottom: "1px solid #eee", textAlign: "right" }}>£{Number(li.price).toFixed(2)}</td>
                <td style={{ padding: 6, borderBottom: "1px solid #eee", textAlign: "right" }}>£{(Number(li.qty) * Number(li.price)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: "right", fontSize: 16, fontWeight: 800, marginTop: 10 }}>Total Due: £{invoice.total}</div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Not VAT registered.</div>
        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "14px 0" }} />
        <div style={{ fontSize: 12 }}><strong>Payment Methods:</strong> {invoice.paymentMethods}</div>
        <div style={{ fontSize: 12, color: "#666" }}>Bank Transfer — {BUSINESS.bank.accountName} · Sort Code {BUSINESS.bank.sortCode} · Account {BUSINESS.bank.accountNumber}</div>
        {invoice.notes && <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>{invoice.notes}</div>}
        <div style={{ fontSize: 11, color: "#999", marginTop: 18, textAlign: "center" }}>Questions about this invoice? Call {BUSINESS.phone}</div>
      </div>

      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Select value={invoice.status} options={INVOICE_STATUSES} onChange={e => onStatusChange(e.target.value)} style={{ flex: 1 }} />
        <Button variant="outline" onClick={download} disabled={downloading}>{downloading ? "Generating…" : "⬇️ Download PDF"}</Button>
        <Button onClick={send} disabled={sending || !invoice.clientEmail}>{sending ? "Sending…" : "✉️ Email to Client"}</Button>
      </div>
    </div>
  );
}
