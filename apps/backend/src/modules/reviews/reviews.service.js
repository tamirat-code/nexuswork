import Review from "./reviews.model.js";
import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import Submission from "../submissions/submissions.model.js";
import Dispute from "../disputes/disputes.model.js";
import Verification from "../verifications/verifications.model.js";
import StudentProfile from "../students/students.model.js";
import User from "../users/users.model.js";
import { env } from "../../config/env.js";
import { signCredential, verifyCredentialProof } from "../verifications/credential-signing.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

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
    Review.find({ reviewee_id: userId }).populate("reviewer_id", "name avatarUrl role").sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean(),
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

function idOf(value) {
  return value?._id || value;
}

function isoDate(value) {
  return value ? new Date(value).toISOString() : null;
}

/**
 * Build a privacy-safe, versioned reputation document from authoritative
 * records. Reviews, delivery evidence, disputes, and credentials stay in
 * their source collections; this document is an export projection only.
 */
export function buildReputationExport({
  user,
  reviews = [],
  milestones = [],
  submissions = [],
  disputes = [],
  verifications = [],
  profile,
  issuedAt = new Date(),
}) {
  const firstSubmissionByMilestone = new Map();
  for (const submission of submissions) {
    const milestoneId = String(idOf(submission.milestone_id));
    if (!firstSubmissionByMilestone.has(milestoneId)) {
      firstSubmissionByMilestone.set(milestoneId, submission);
    }
  }

  const deliveryMetrics = milestones.map((milestone) => {
    const firstSubmission = firstSubmissionByMilestone.get(String(milestone._id));
    const submittedAt = firstSubmission?.submitted_at || firstSubmission?.createdAt || null;
    const completedAt = milestone.released_at || milestone.approved_at || milestone.delivered_at || null;
    const dueDate = milestone.due_date || null;
    return {
      milestoneId: String(milestone._id),
      dueDate: isoDate(dueDate),
      submittedAt: isoDate(submittedAt),
      completedAt: isoDate(completedAt),
      status: milestone.status,
      onTime: Boolean(submittedAt && dueDate && new Date(submittedAt) <= new Date(dueDate)),
    };
  });

  const outcomeCounts = {};
  const statusCounts = {};
  for (const dispute of disputes) {
    const outcome = dispute.outcome || "unresolved";
    outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
    statusCounts[dispute.status] = (statusCounts[dispute.status] || 0) + 1;
  }

  const issuerId = env.credentialIssuerUrl;
  const verificationCredentials = verifications.map((verification) => ({
    id: `${issuerId}/v1/verifications/${verification._id}/credential`,
    type: "VerifiableCredential",
    issuer: issuerId,
    issuedAt: isoDate(verification.reviewed_at || verification.updatedAt || verification.createdAt),
    status: "active",
  }));

  const verifiedSkills = (profile?.skills || [])
    .filter((skill) => skill.verification_method === "university_certified")
    .map((skill) => ({
      name: skill.name,
      category: skill.category,
      level: skill.level,
      verificationMethod: skill.verification_method,
      certifiedAt: isoDate(skill.certified_at),
    }));

  const unsigned = {
    "@context": "https://nexuswork.example/contexts/reputation-export/v1",
    id: `${issuerId}/v1/reviews/user/${user._id}/reputation/export`,
    version: "1.0",
    type: ["VerifiableCredential", "NexusWorkReputationCredential"],
    issuer: { id: issuerId, name: "NexusWork" },
    issuedAt: isoDate(issuedAt),
    credentialSubject: {
      id: `${issuerId}/v1/students/${user._id}`,
      name: user.name,
    },
    ratings: reviews.map((review) => ({
      id: String(review._id),
      rating: review.rating,
      createdAt: isoDate(review.createdAt),
    })),
    deliveryMetrics,
    disputeOutcomes: {
      total: disputes.length,
      statusCounts,
      outcomeCounts,
    },
    verifiedSkills,
    credentials: verificationCredentials,
    privacy: {
      excluded: ["contact information", "client identities", "private review text", "dispute reasons", "audit records"],
    },
    credentialStatus: { status: "active" },
  };

  return signCredential(unsigned);
}

export async function exportReputation(userId, requestingUserId) {
  if (String(userId) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the reputation subject can export this document");
  }

  const [user, reviews, contracts, profile, verifications] = await Promise.all([
    User.findById(userId).select("name").lean(),
    Review.find({ reviewee_id: userId }).select("rating createdAt").sort({ createdAt: 1 }).lean(),
    Contract.find({ student_id: userId }).select("_id").lean(),
    StudentProfile.findOne({ user_id: userId }).select("skills").lean(),
    Verification.find({ user_id: userId, status: "approved" }).select("_id reviewed_at updatedAt createdAt").lean(),
  ]);
  if (!user) throw new NotFoundError("Reputation subject not found");

  const contractIds = contracts.map((contract) => contract._id);
  const milestones = contractIds.length
    ? await Milestone.find({ contract_id: { $in: contractIds } })
      .select("_id due_date status delivered_at approved_at released_at")
      .sort({ sequence: 1 })
      .lean()
    : [];
  const milestoneIds = milestones.map((milestone) => milestone._id);
  const [submissions, disputes] = milestoneIds.length
    ? await Promise.all([
      Submission.find({ milestone_id: { $in: milestoneIds } })
        .select("milestone_id submitted_at createdAt")
        .sort({ submitted_at: 1, createdAt: 1 })
        .lean(),
      Dispute.find({ milestone_id: { $in: milestoneIds } })
        .select("milestone_id status outcome")
        .lean(),
    ])
    : [[], []];

  return buildReputationExport({ user, reviews, milestones, submissions, disputes, verifications, profile });
}

export function verifyReputationExport(document) {
  if (!document?.version || !document?.credentialSubject?.id || !document?.type?.includes("NexusWorkReputationCredential")) {
    return { valid: false, reason: "Document is not a supported NexusWork reputation export" };
  }
  return verifyCredentialProof(document);
}
