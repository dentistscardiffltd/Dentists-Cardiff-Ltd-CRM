import React, { useEffect, useState, useCallback } from "react";
import { theme as t } from "../theme";
import { apiGet, apiPost } from "../api";
import { BUSINESS, INVOICE_STATUSES } from "../config";
import Header from "./Header";
import { Card, Badge, Button, Modal, EmptyState, Spinner, Field, Select, Input, Textarea } from "./shared";

const statusColors = { Draft: t.muted, Sent: t.amber, Paid: t.green };

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

function InvoiceBuilder({ prefillJob, onCreated }) {
  const [clientName, setClientName] = useState(prefillJob ? prefillJob.clientName : "");
  const [clientEmail, setClientEmail] = useState(prefillJob ? prefillJob.email : "");
  const [clientAddress, setClientAddress] = useState(prefillJob ? prefillJob.location : "");
  const [vehicleReg, setVehicleReg] = useState(prefillJob ? prefillJob.vehicleReg : "");
  const [lineItems, setLineItems] = useState(
    prefillJob && prefillJob.service
      ? [{ description: prefillJob.service, qty: 1, price: prefillJob.price || "" }]
      : [{ description: "", qty: 1, price: "" }]
  );
  const [paymentMethods, setPaymentMethods] = useState(BUSINESS.paymentMethods);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const total = lineItems.reduce((sum, li) => sum + (Number(li.qty) || 0) * (Number(li.price) || 0), 0);

  const updateItem = (idx, key, value) => {
    setLineItems(items => items.map((it, i) => i === idx ? { ...it, [key]: value } : it));
  };
  const addItem = () => setLineItems(items => [...items, { description: "", qty: 1, price: "" }]);
  const removeItem = (idx) => setLineItems(items => items.filter((_, i) => i !== idx));

  const togglePayment = (method) => {
    setPaymentMethods(pm => pm.includes(method) ? pm.filter(m => m !== method) : [...pm, method]);
  };

  const submit = async () => {
    if (!clientName.trim()) { alert("Client name is required"); return; }
    setSaving(true);
    try {
      await apiPost("createInvoice", {
        jobId: prefillJob ? prefillJob.id : "",
        clientName, clientEmail, clientAddress, vehicleReg,
        lineItems: lineItems.filter(li => li.description.trim()),
        paymentMethods, notes
      });
      onCreated();
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Client Name *"><Input value={clientName} onChange={e => setClientName(e.target.value)} /></Field>
        <Field label="Client Email"><Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} /></Field>
      </div>
      <Field label="Client Address"><Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} /></Field>
      <Field label="Vehicle Reg"><Input value={vehicleReg} onChange={e => setVehicleReg(e.target.value)} /></Field>

      <div style={{ fontSize: 12, fontWeight: 700, color: t.muted, textTransform: "uppercase", marginBottom: 8 }}>Line Items</div>
      {lineItems.map((li, idx) => (
        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 50px 70px 24px", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <Input placeholder="Description" value={li.description} onChange={e => updateItem(idx, "description", e.target.value)} />
          <Input type="number" placeholder="Qty" value={li.qty} onChange={e => updateItem(idx, "qty", e.target.value)} />
          <Input type="number" placeholder="£" value={li.price} onChange={e => updateItem(idx, "price", e.target.value)} />
          <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: t.red, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
      ))}
      <Button variant="outline" onClick={addItem} style={{ marginBottom: 16 }}>+ Add Line</Button>

      <div style={{ textAlign: "right", fontSize: 18, fontWeight: 800, color: t.green, marginBottom: 16 }}>
        Total: £{total.toFixed(2)}
      </div>

      <Field label="Payment Methods">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Card", "Cash", "Bank Transfer"].map(method => (
            <button key={method} onClick={() => togglePayment(method)} style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: `1px solid ${paymentMethods.includes(method) ? t.green : t.border}`,
              background: paymentMethods.includes(method) ? `${t.green}1a` : "transparent",
              color: paymentMethods.includes(method) ? t.green : t.muted, cursor: "pointer"
            }}>{method}</button>
          ))}
        </div>
      </Field>

      <Field label="Notes"><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></Field>

      <Button onClick={submit} disabled={saving} style={{ width: "100%" }}>{saving ? "Saving…" : "Save Invoice"}</Button>
    </div>
  );
}

function InvoicePreview({ invoice, onStatusChange }) {
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await apiPost("sendInvoiceEmail", { invoiceId: invoice.id });
      onStatusChange("Sent");
      alert("Invoice emailed to " + invoice.clientEmail);
    } catch (e) { alert(e.message); } finally { setSending(false); }
  };

  return (
    <div>
      <div id="invoice-printable" style={{ background: "#fff", color: "#222", borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <h2 style={{ color: "#3f7d2c", margin: "0 0 2px" }}>Invoice {invoice.invoiceNumber}</h2>
        <div style={{ color: "#666", fontSize: 13 }}>{BUSINESS.tradingName} · {BUSINESS.legalName}</div>
        <div style={{ color: "#666", fontSize: 12 }}>{BUSINESS.address} · Company Reg {BUSINESS.regNumber}</div>
        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "14px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
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
                <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{li.description}</td>
                <td style={{ padding: 6, borderBottom: "1px solid #eee", textAlign: "center" }}>{li.qty}</td>
                <td style={{ padding: 6, borderBottom: "1px solid #eee", textAlign: "right" }}>£{Number(li.price).toFixed(2)}</td>
                <td style={{ padding: 6, borderBottom: "1px solid #eee", textAlign: "right" }}>£{(Number(li.qty) * Number(li.price)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: "right", fontSize: 15, fontWeight: 800, marginTop: 10 }}>Total Due: £{invoice.total}</div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Not VAT registered.</div>
        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "14px 0" }} />
        <div style={{ fontSize: 12 }}><strong>Payment Methods:</strong> {invoice.paymentMethods}</div>
        <div style={{ fontSize: 12, color: "#666" }}>Bank Transfer — {BUSINESS.bank.accountName} · Sort Code {BUSINESS.bank.sortCode} · Account {BUSINESS.bank.accountNumber}</div>
        {invoice.notes && <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>{invoice.notes}</div>}
      </div>

      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Select value={invoice.status} options={INVOICE_STATUSES} onChange={e => onStatusChange(e.target.value)} style={{ flex: 1 }} />
        <Button variant="outline" onClick={() => window.print()}>🖨️ Print / Save PDF</Button>
        <Button onClick={send} disabled={sending || !invoice.clientEmail}>{sending ? "Sending…" : "✉️ Email to Client"}</Button>
      </div>
    </div>
  );
}
