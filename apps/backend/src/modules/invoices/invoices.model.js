import { EventEmitter } from "node:events";

export const eventBus = new EventEmitter();
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoice_type: { type: String, enum: ["individual", "organization_consolidated", "api_partner"], default: "individual" },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: "ApiPartner", default: null },
    contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone" },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    invoice_number: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    amount_minor: { type: Number, min: 0 },
    currency: { type: String, default: "usd" },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    due_date: { type: Date },
    paid_at: { type: Date },
    billing_mode: { type: String, enum: ["individual", "consolidated", "net_30"] },
    commission_minor: { type: Number, min: 0, default: 0 },
    tax_minor: { type: Number, min: 0, default: 0 },
    fee_minor: { type: Number, min: 0, default: 0 },
    provider_reference: { type: String, trim: true },
    ledger_journal_ids: [{ type: String }],
    reconciliation_status: { type: String, enum: ["pending", "reconciled", "exception"], default: "pending" },
    reconciled_at: { type: Date },
    reconciliation_error: { type: String, maxlength: 500 },
    consolidation_key: { type: String, unique: true, sparse: true },
    line_items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unit_price: { type: Number, required: true },
        unit_price_minor: { type: Number, min: 0 },
        contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
        milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone" },
        commission_minor: { type: Number, min: 0, default: 0 },
        tax_minor: { type: Number, min: 0, default: 0 },
        fee_minor: { type: Number, min: 0, default: 0 },
        provider_reference: { type: String, trim: true },
        ledger_journal_id: { type: String },
      },
    ],
  },
  { timestamps: true }
);

invoiceSchema.index({ contract_id: 1 });
invoiceSchema.index({ client_id: 1, createdAt: -1 });
invoiceSchema.index({ student_id: 1, createdAt: -1 });
invoiceSchema.index({ organization_id: 1, createdAt: -1 });
invoiceSchema.index({ partner_id: 1, createdAt: -1 });

export default mongoose.model("Invoice", invoiceSchema);
