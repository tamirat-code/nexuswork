import mongoose from "mongoose";

const taskArtifactSchema = new mongoose.Schema({
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
  milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", default: null },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  kind: { type: String, enum: ["upload", "link", "text", "commit", "check_in"], required: true },
  title: { type: String, required: true, trim: true, maxlength: 240 },
  body: { type: String, default: "", maxlength: 10000 },
  url: { type: String, default: null, trim: true },
  file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File", default: null },
  provider: { type: String, enum: ["github", "gitlab", "nexuswork"], default: "nexuswork" },
  repository_connection_id: { type: mongoose.Schema.Types.ObjectId, ref: "RepositoryConnection", default: null },
  external_id: { type: String, default: null },
  occurred_at: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

taskArtifactSchema.index({ contract_id: 1, occurred_at: -1 });
taskArtifactSchema.index({ repository_connection_id: 1, external_id: 1 }, { unique: true, sparse: true });

export default mongoose.model("TaskArtifact", taskArtifactSchema);
