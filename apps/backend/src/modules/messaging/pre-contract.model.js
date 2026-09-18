import mongoose from "mongoose";

const preContractConversationSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    last_message_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

preContractConversationSchema.index({ project_id: 1, client_id: 1, student_id: 1 }, { unique: true });

const preContractMessageSchema = new mongoose.Schema(
  {
    conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: "PreContractConversation", required: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: true }
);

preContractMessageSchema.index({ conversation_id: 1, createdAt: 1 });

export const PreContractConversation = mongoose.model("PreContractConversation", preContractConversationSchema);
export const PreContractMessage = mongoose.model("PreContractMessage", preContractMessageSchema);
