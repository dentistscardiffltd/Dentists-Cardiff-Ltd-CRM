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
export const LEAD_STATUSES = ["New", "Contacted", "Quoted", "Converted", "Lost"];
export const INVOICE_STATUSES = ["Draft", "Sent", "Paid"];
