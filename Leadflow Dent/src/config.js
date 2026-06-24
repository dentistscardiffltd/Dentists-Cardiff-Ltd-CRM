// ─────────────────────────── CONFIG ───────────────────────────
// Paste your Apps Script Web App URL here (the same one used by the
// website form — this CRM talks to the same backend).
export const API_URL = "https://script.google.com/macros/s/AKfycbzclAlXOdEfz53sevKQShM6unuq_fva6DvRaFyQFuwRd1FvEl0mrrZbDkaA9B5IWh29/exec";

// Must exactly match APP_TOKEN in Code.gs
export const APP_TOKEN = "dc-crm-7f3k9p2m-q4xz";

// PIN to unlock the app on this device
export const APP_PIN = "141102";

export const BUSINESS = {
  tradingName: "Dent-ists Cardiff",
  legalName: "Malone's Services Ltd",
  regNumber: "16846189",
  address: "19 Orbit Street, Caerdydd, United Kingdom, CF24 0JX",
  phone: "029 2252 6783",
  email: "booking@dentistscardiffltd.co.uk",
  vatRegistered: false,
  bank: {
    accountName: "Malone's Services Ltd",
    sortCode: "04-06-05",
    accountNumber: "29306931"
  },
  paymentMethods: ["Card", "Cash", "Bank Transfer"]
};

export const JOB_STATUSES = ["Booked", "In Progress", "Completed", "Invoiced", "Cancelled"];
export const LEAD_STATUSES = ["New", "Booked", "N/A"];
export const INVOICE_STATUSES = ["Draft", "Sent", "Paid"];

// Common services for quick line-item entry on invoices. Edit prices/labels
// any time — this is just a starting list, not fixed pricing.
export const SERVICE_PRESETS = [
  { label: "Custom item", price: "" },
  { label: "Small Dent Repair (PDR)", price: 60 },
  { label: "Medium Dent Repair (PDR)", price: 90 },
  { label: "Large Dent Repair (PDR)", price: 140 },
  { label: "Scratch Repair (SMART)", price: 80 },
  { label: "Bumper Scuff Repair", price: 90 },
  { label: "Bumper Full Respray", price: 180 },
  { label: "Alloy Wheel Refurb (per wheel)", price: 50 },
  { label: "Panel Respray", price: 200 },
  { label: "Call-Out Fee", price: 25 }
];
