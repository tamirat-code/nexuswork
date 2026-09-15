import mongoose from "mongoose";

const apiBillingLedgerSchema = new mongoose.Schema(
  {
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: "ApiPartner", required: true },
    period_start: { type: Date, required: true },
    period_end: { type: Date, required: true },
    currency: { type: String, default: "usd", lowercase: true, immutable: true },
    status: { type: String, enum: ["open", "issued", "paid", "void"], default: "open" },
    invoice_number: { type: String, unique: true, sparse: true },
    request_count: { type: Number, default: 0, min: 0 },
    data_read_count: { type: Number, default: 0, min: 0 },
    export_count: { type: Number, default: 0, min: 0 },
    price_per_1000_minor: { type: Number, required: true, min: 0 },
    amount_minor: { type: Number, default: 0, min: 0 },
    issued_at: { type: Date },
    paid_at: { type: Date },
  },
  { timestamps: true }
);

apiBillingLedgerSchema.index({ partner_id: 1, period_start: 1 }, { unique: true });
apiBillingLedgerSchema.index({ partner_id: 1, createdAt: -1 });

export default mongoose.model("ApiBillingLedger", apiBillingLedgerSchema);
