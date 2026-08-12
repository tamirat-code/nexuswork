import { EventEmitter } from "node:events";

export const eventBus = new EventEmitter();
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone" },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invoice_number: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    due_date: { type: Date },
    paid_at: { type: Date },
    line_items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unit_price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

invoiceSchema.index({ contract_id: 1 });
invoiceSchema.index({ client_id: 1, createdAt: -1 });
invoiceSchema.index({ student_id: 1, createdAt: -1 });

export default mongoose.model("Invoice", invoiceSchema);
