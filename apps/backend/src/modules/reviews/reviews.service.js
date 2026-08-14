import Review from "./reviews.model.js";
import Contract from "../contracts/contracts.model.js";

export async function submitReview(contractId, reviewerId, { reviewee_id, rating, text }) {
  const contract = await Contract.findById(contractId);
  if (!contract) {
    const err = new Error("Contract not found");
    err.status = 404;
    throw err;
  }
  const isParty = [String(contract.client_id), String(contract.student_id)].includes(String(reviewerId));
  if (!isParty) {
    const err = new Error("Only contract parties can leave a review");
    err.status = 403;
    throw err;
  }
  return Review.create({ contract_id: contractId, reviewer_id: reviewerId, reviewee_id, rating, text });
}

export async function listForUser(userId, { limit = 50, skip = 0 } = {}) {
  const [reviews, total] = await Promise.all([
    Review.find({ reviewee_id: userId }).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean(),
    Review.countDocuments({ reviewee_id: userId }),
  ]);
  return { reviews, total, limit: Number(limit), skip: Number(skip) };
}
