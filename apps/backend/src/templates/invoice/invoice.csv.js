function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatMoney(amount) {
  return (Math.round((amount ?? 0) * 100) / 100).toFixed(2);
}

// Builds a CSV export of a single invoice: a header block followed by one row per line item.
export function renderInvoiceCsv(invoice) {
  const rows = [];

  rows.push(["Invoice Number", invoice.invoice_number]);
  rows.push(["Status", invoice.status]);
  rows.push(["Currency", (invoice.currency || "usd").toUpperCase()]);
  rows.push(["Issued", invoice.createdAt ? new Date(invoice.createdAt).toISOString().slice(0, 10) : ""]);
  rows.push(["Due", invoice.due_date ? new Date(invoice.due_date).toISOString().slice(0, 10) : ""]);
  rows.push(["Client", invoice.client_id?.name || ""]);
  rows.push(["Student", invoice.student_id?.name || ""]);
  rows.push(["Project", invoice.contract_id?.terms?.title || ""]);
  rows.push([]);
  rows.push(["Description", "Quantity", "Unit Price", "Line Total"]);

  for (const item of invoice.line_items || []) {
    const lineTotal = (item.quantity ?? 1) * (item.unit_price ?? 0);
    rows.push([item.description, item.quantity ?? 1, formatMoney(item.unit_price), formatMoney(lineTotal)]);
  }

  rows.push([]);
  rows.push(["Total", "", "", formatMoney(invoice.amount)]);

  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n") + "\r\n";
}