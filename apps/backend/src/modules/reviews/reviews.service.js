import Review from "./reviews.model.js";
import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import Submission from "../submissions/submissions.model.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";

export async function submitReview(contractId, reviewerId, { reviewee_id, rating, text }) {
  const contract = await Contract.findById(contractId);
  if (!contract) {
    const err = new Error("Contract not found");
    err.status = 404;
    throw err;
  }
  if (contract.status !== "completed") {
    throw new ValidationError("Reviews are available only after the contract is completed.");
  }

  const reviewerIsClient = String(contract.client_id) === String(reviewerId);
  const reviewerIsStudent = String(contract.student_id) === String(reviewerId);
  if (!reviewerIsClient && !reviewerIsStudent) {
    const err = new Error("Only contract parties can leave a review");
    err.status = 403;
    throw err;
  }

  const expectedReviewee = reviewerIsClient ? String(contract.student_id) : String(contract.client_id);
  if (String(reviewee_id) !== expectedReviewee) {
    throw new ValidationError("You can only review the other party in this contract.");
  }

  try {
    return await Review.create({ contract_id: contractId, reviewer_id: reviewerId, reviewee_id, rating, text });
  } catch (err) {
    if (err.code === 11000) {
      throw new ValidationError("You've already reviewed this contract.");
    }
    throw err;
  }
}

export async function listForUser(userId, { limit = 50, skip = 0 } = {}) {
  const [reviews, total] = await Promise.all([
    Review.find({ reviewee_id: userId }).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean(),
    Review.countDocuments({ reviewee_id: userId }),
  ]);
  return { reviews, total, limit: Number(limit), skip: Number(skip) };
}


export async function getReputationScore(userId) {
  const [reviews, contracts] = await Promise.all([
    Review.find({ reviewee_id: userId }).lean(),
    Contract.find({ student_id: userId }).lean(),
  ]);

  const reviewCount = reviews.length;
  const avgRating = reviewCount ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null;
  // Normalize a 1-5 rating to 0-100; with no reviews yet, treat as neutral (60).
  const ratingScore = avgRating !== null ? ((avgRating - 1) / 4) * 100 : 60;

  const contractIds = contracts.map((c) => c._id);
  const milestones = contractIds.length
    ? await Milestone.find({ contract_id: { $in: contractIds } }).lean()
    : [];

  const releasedMilestones = milestones.filter((m) => m.status === "released");
  const disputedOrHadDispute = milestones.filter((m) => m.status === "disputed").length;
  const totalTerminalMilestones = milestones.filter((m) =>
    ["released", "disputed"].includes(m.status)
  ).length;

  const completionRate = totalTerminalMilestones
    ? releasedMilestones.length / totalTerminalMilestones
    : null;
  const disputeRate = totalTerminalMilestones ? disputedOrHadDispute / totalTerminalMilestones : null;

  let onTimeRate = null;
  if (releasedMilestones.length) {
    const releasedIds = releasedMilestones.map((m) => m._id);
    const firstSubmissions = await Submission.aggregate([
      { $match: { milestone_id: { $in: releasedIds } } },
      { $sort: { version: 1 } },
      { $group: { _id: "$milestone_id", firstSubmittedAt: { $first: "$createdAt" } } },
    ]);
    const submittedAtByMilestone = new Map(firstSubmissions.map((s) => [String(s._id), s.firstSubmittedAt]));
    const onTimeCount = releasedMilestones.filter((m) => {
      const submittedAt = submittedAtByMilestone.get(String(m._id));
      return submittedAt && new Date(submittedAt) <= new Date(m.due_date);
    }).length;
    onTimeRate = onTimeCount / releasedMilestones.length;
  }

  
  const components = [
    { value: ratingScore, weight: 0.5 },
    { value: completionRate !== null ? completionRate * 100 : null, weight: 0.2 },
    { value: onTimeRate !== null ? onTimeRate * 100 : null, weight: 0.2 },
    { value: disputeRate !== null ? (1 - disputeRate) * 100 : null, weight: 0.1 },
  ];

  const availableWeight = components.filter((c) => c.value !== null).reduce((sum, c) => sum + c.weight, 0);
  const score = availableWeight
    ? components.reduce((sum, c) => sum + (c.value !== null ? c.value * c.weight : 0), 0) / availableWeight
    : ratingScore;

  return {
    score: Math.round(score * 10) / 10,
    review_count: reviewCount,
    average_rating: avgRating !== null ? Math.round(avgRating * 100) / 100 : null,
    completion_rate: completionRate !== null ? Math.round(completionRate * 1000) / 1000 : null,
    on_time_rate: onTimeRate !== null ? Math.round(onTimeRate * 1000) / 1000 : null,
    dispute_rate: disputeRate !== null ? Math.round(disputeRate * 1000) / 1000 : null,
  };
}