import mongoose from "mongoose";

const repositoryConnectionSchema = new mongoose.Schema({
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  provider: { type: String, enum: ["github", "gitlab"], required: true },
  provider_user_id: { type: String, required: true },
  provider_repository_id: { type: String, required: true },
  repository: { type: String, required: true, trim: true },
  default_branch: { type: String, default: "main" },
  scopes: [{ type: String }],
  token_encrypted: { type: String, required: true, select: false },
  status: { type: String, enum: ["active", "revoked"], default: "active" },
  last_sync_at: { type: Date, default: null },
  last_sync_error: { type: String, default: "" },
}, { timestamps: true });

repositoryConnectionSchema.index({ contract_id: 1, status: 1 });
repositoryConnectionSchema.index({ student_id: 1, provider: 1, repository: 1 }, { unique: true });

export default mongoose.model("RepositoryConnection", repositoryConnectionSchema);
