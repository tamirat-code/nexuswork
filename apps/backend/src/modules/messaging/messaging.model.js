import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    attachments: [{ url: String, filename: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
