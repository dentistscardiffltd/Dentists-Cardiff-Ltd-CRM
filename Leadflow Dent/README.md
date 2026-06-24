# Dent-ists Cardiff — CRM

A small internal tool for Dent-ists Cardiff covering:

- **Leads** — every quote request submitted on the website, with all fields and photos, and a button to convert a lead into a Job.
- **Jobs** — booked work, status tracking (Booked → In Progress → Completed → Invoiced), price, notes.
- **Calendar** — month grid or list view of jobs by date.
- **Invoices** — build an invoice from a job (or from scratch), email it to the customer with a PDF attached, print/save as PDF, track Draft/Sent/Paid.

It's PIN-locked (see `src/config.js`) and talks to the same Google Apps Script backend that powers the website's quote form — all data lives in your Google Sheet.

## Local development

```
npm install
npm start
```

## Configuration

Everything business-specific lives in `src/config.js`:
- `API_URL` — your Apps Script Web App URL
- `APP_TOKEN` — must match `APP_TOKEN` in the Apps Script `Code.gs`
- `APP_PIN` — the PIN to unlock the app
- `BUSINESS` — trading name, legal name, address, bank details, payment methods

## Deployment

See `SETUP_CRM.md` for the full GitHub + Vercel walkthrough.
