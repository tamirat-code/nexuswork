// TODO: real invoice HTML/PDF template — see docs/api for the invoice data shape.
export function invoiceTemplate(invoice) {
  return `Invoice #${invoice._id} — amount: ${invoice.amount}`;
}
