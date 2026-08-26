import PortfolioItem from "./portfolios.model.js";
import Milestone from "../milestones/milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import { isOrgMember } from "../clients/clients.service.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../shared/exceptions/AppError.js";
import File from "../files/files.model.js";

export async function createPortfolioItem(userId, data) {
  if (data.file_id) {
    const file = await File.findOne({ _id: data.file_id, owner_id: userId });
    if (!file) throw new ForbiddenError("Portfolio file must belong to you");
  }

  const item = await PortfolioItem.create({
    user_id: userId,
    title: data.title,
    description: data.description || "",
    project_url: data.project_url,
    image_url: data.image_url,
    file_id: data.file_id,
    tags: data.tags || [],
    is_published: data.is_published !== undefined ? data.is_published : true,
  });

  if (data.file_id) {
    await File.findByIdAndUpdate(data.file_id, { related_type: "portfolio", related_id: item._id });
  }
  return item;
}

export async function listForUser(userId, { publishedOnly = false } = {}) {
  const query = { user_id: userId };
  if (publishedOnly) query.is_published = true;
  return PortfolioItem.find(query).sort({ createdAt: -1 }).lean();
}

export async function getById(id) {
  const item = await PortfolioItem.findById(id).lean();
  if (!item) throw new NotFoundError("Portfolio item not found");
  return item;
}

export async function updatePortfolioItem(id, userId, updates) {
  const item = await PortfolioItem.findById(id);
  if (!item) throw new NotFoundError("Portfolio item not found");
  if (String(item.user_id) !== String(userId)) throw new ForbiddenError("Only the owner can update this portfolio item");

  Object.assign(item, updates);
  await item.save();
  return item;
}

export async function deletePortfolioItem(id, userId) {
  const item = await PortfolioItem.findById(id);
  if (!item) throw new NotFoundError("Portfolio item not found");
  if (String(item.user_id) !== String(userId)) throw new ForbiddenError("Only the owner can delete this portfolio item");

  await item.deleteOne();
  return { deleted: true };
}


export async function addFromMilestone(studentId, milestoneId) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = milestone.contract_id;

  if (String(contract.student_id) !== String(studentId)) {
    throw new ForbiddenError("Only the student on this contract can add it to their portfolio");
  }
  if (milestone.status !== "released") {
    throw new ValidationError("Only a completed (released) milestone can be added to your portfolio");
  }

  const existing = await PortfolioItem.findOne({ milestone_id: milestone._id });
  if (existing) throw new ValidationError("This milestone has already been added to your portfolio");

  return PortfolioItem.create({
    user_id: studentId,
    title: milestone.title,
    description: `Milestone completed on contract ${contract._id}.`,
    milestone_id: milestone._id,
    consent_status: "pending",
    is_published: false,
  });
}

export async function respondToMilestoneConsent(portfolioItemId, requestingUserId, decision) {
  if (!["approved", "denied"].includes(decision)) {
    throw new ValidationError("Decision must be 'approved' or 'rejected'");
  }
  const item = await PortfolioItem.findById(portfolioItemId);
  if (!item) throw new NotFoundError("Portfolio item not found");
  if (!item.milestone_id) throw new ValidationError("This portfolio item is not linked to a milestone");

  const milestone = await Milestone.findById(item.milestone_id).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = milestone.contract_id;

  if (String(contract.client_id) !== String(requestingUserId)) {
    const allowed = await isOrgMember(contract.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("Only the client on this contract can grant portfolio consent");
  }

  item.consent_status = decision;
  item.consented_by = requestingUserId;
  item.consented_at = new Date();
  item.is_published = decision === "approved";
  await item.save();
  return item;
}

export async function getMilestoneConsent(milestoneId, requestingUserId) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = milestone.contract_id;
  if (String(contract.client_id) !== String(requestingUserId)) {
    const allowed = await isOrgMember(contract.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("Only the client on this contract can view portfolio consent");
  }
  return PortfolioItem.findOne({ milestone_id: milestone._id }).lean();
}
