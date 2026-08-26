import mongoose from "mongoose";

const entrySchema = new mongoose.Schema(
  {
    account_key: { type: String, required: true, immutable: true },
    account_type: { type: String, required: true, immutable: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", immutable: true },
    debit_minor: { type: Number, required: true, min: 0, immutable: true },
    credit_minor: { type: Number, required: true, min: 0, immutable: true },
    currency: { type: String, required: true, lowercase: true, immutable: true },
  },
  { _id: false }
);

const journalSchema = new mongoose.Schema(
  {
    transaction_id: { type: String, required: true, unique: true, immutable: true },
    idempotency_key: { type: String, required: true, unique: true, immutable: true },
    event_type: { type: String, required: true, immutable: true },
    source_type: { type: String, required: true, immutable: true },
    source_id: { type: String, required: true, immutable: true },
    provider_event_id: { type: String, immutable: true },
    request_id: { type: String, required: true, immutable: true },
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", immutable: true },
    actor_role: { type: String, immutable: true },
    entries: { type: [entrySchema], required: true, immutable: true },
    reversed_transaction_id: { type: String, immutable: true },
    metadata: { type: mongoose.Schema.Types.Mixed, immutable: true },
  },
  { timestamps: true }
);

const immutableError = function immutableError(next) {
  next(new Error("Financial journals are append-only; use a reversal journal for corrections"));
};

journalSchema.pre("save", function preventJournalMutation(next) {
  if (!this.isNew) return immutableError(next);
  next();
});
for (const hook of ["updateOne", "updateMany", "findOneAndUpdate", "replaceOne", "deleteOne", "deleteMany", "findOneAndDelete"]) {
  journalSchema.pre(hook, immutableError);
}

export default mongoose.models.FinancialJournal || mongoose.model("FinancialJournal", journalSchema);
