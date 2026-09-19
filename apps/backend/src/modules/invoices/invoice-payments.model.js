import mongoose from "mongoose";

const invoicePaymentSchema = new mongoose.Schema(
  {
    invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    amount_minor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true },
    provider: { type: String, enum: ["stripe", "chapa"], required: true },
    provider_payment_id: { type: String },
    provider_reference: { type: String },
    provider_checkout_url: { type: String },
    provider_event_id: { type: String },
    status: { type: String, enum: ["created", "pending", "succeeded", "failed"], default: "pending" },
    failure_message: { type: String },
    ledger_journal_ids: [{ type: String }],
    operation_key: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

invoicePaymentSchema.index({ provider: 1, provider_payment_id: 1 }, { unique: true, sparse: true });
invoicePaymentSchema.index({ invoice_id: 1, status: 1 });

export default mongoose.model("InvoicePayment", invoicePaymentSchema);
