import Payment from "./payments.model.js";
import Milestone from "../milestones/milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import { paymentConfig } from "../../config/payment.config.js";

export async function processSandboxPayment(amount) {
  return { status: "succeeded", processor_ref: `${paymentConfig.provider}_sandbox_${Date.now()}` };
}

export async function recordPayment({ milestone_id, amount, direction }) {
  const result = await processSandboxPayment(amount);
  return Payment.create({ milestone_id, amount, direction, ...result });
}

export async function listForUser(userId) {
  const contracts = await Contract.find({ $or: [{ client_id: userId }, { student_id: userId }] }).select("_id");
  const contractIds = contracts.map((c) => c._id);
  const milestones = await Milestone.find({ contract_id: { $in: contractIds } }).select("_id");
  const milestoneIds = milestones.map((m) => m._id);
  return Payment.find({ milestone_id: { $in: milestoneIds } }).sort({ createdAt: -1 }).limit(100);
}