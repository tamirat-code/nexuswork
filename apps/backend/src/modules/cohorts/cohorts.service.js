import crypto from "node:crypto";
import CohortProgram from "./cohort-program.model.js";
import CohortApplication from "./cohort-application.model.js";
import Organization from "../organizations/organizations.model.js";
import OrgMembership from "../organizations/org-membership.model.js";
import Skill from "../skills/skills.model.js";
import Project from "../projects/projects.model.js";
import Proposal from "../proposals/proposals.model.js";
import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import Payment from "../payments/payments.model.js";
import { requireOrganizationAccess } from "../organizations/organization-access.service.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { ForbiddenError, NotFoundError, ConflictError, ValidationError } from "../../shared/exceptions/AppError.js";

async function requireProgramAccess(program, user, roles = ["admin", "recruiter"]) {
  if (user.role === "admin") return { role: "admin" };
  return requireOrganizationAccess(program.organization_id?._id || program.organization_id, user._id, roles);
}

function termsFingerprint(terms) {
  return crypto.createHash("sha256").update(JSON.stringify({ version: 1, terms })).digest("hex");
}

async function audit(actor, eventType, action, program, metadata = {}) {
  return recordEvent({ actor, eventType, action, entityType: "organization", entityId: program.organization_id, organizationId: program.organization_id, correlationId: crypto.randomUUID(), metadata: { cohortId: program._id, ...metadata } });
}

export async function createCohort(actor, input) {
  const access = actor.role === "admin" ? { role: "admin" } : await requireOrganizationAccess(input.organization_id, actor._id, ["admin", "recruiter"]);
  const organization = await Organization.findOne({ _id: input.organization_id, status: "active" }).lean();
  if (!organization || !access) throw new ForbiddenError("You cannot create a cohort for this organization");
  if (input.application_deadline <= new Date()) throw new ValidationError("Application deadline must be in the future");
  const skills = input.skill_ids.length ? await Skill.find({ _id: { $in: input.skill_ids }, is_active: true }).select("_id name").lean() : [];
  if (skills.length !== input.skill_ids.length) throw new ValidationError("One or more cohort skills are unavailable");
  const program = await CohortProgram.create({ name: input.name, institution_id: input.institution_id || organization.institution_id || null, organization_id: input.organization_id, created_by: actor._id, seats: input.seats, skill_ids: skills.map((skill) => skill._id), skill_names: skills.map((skill) => skill.name), application_deadline: input.application_deadline, shared_terms: { description: input.description, total_amount: input.total_amount, currency: input.currency, delivery_time_days: input.delivery_time_days, milestone_title: input.milestone_title || "Cohort delivery milestone" }, status: input.status });
  const project = await Project.create({ client_id: organization.owner_id, created_by: actor._id, organization_id: input.organization_id, is_cohort_program: true, title: `[Cohort] ${program.name}`, description: input.description, required_skill_ids: skills.map((skill) => skill._id), required_skills: skills.map((skill) => skill.name), category: "Cohort hiring", budget: input.total_amount, currency: input.currency, deadline: input.application_deadline });
  program.project_id = project._id;
  await program.save();
  await audit(actor, "COHORT_CREATED", "cohort.created", program, { seats: program.seats });
  return program;
}

export async function listCohorts(user, { organization_id, status } = {}) {
  const query = { status: status || "open", application_deadline: { $gte: new Date() } };
  if (organization_id) { await requireOrganizationAccess(organization_id, user._id); query.organization_id = organization_id; }
  else if (user.role !== "student" && user.role !== "admin") query.organization_id = { $in: await OrgMembership.find({ user_id: user._id, status: "active" }).distinct("organization_id") };
  return CohortProgram.find(query).populate("organization_id", "name").sort({ application_deadline: 1 }).lean();
}

export async function getCohort(cohortId, user) {
  const program = await CohortProgram.findById(cohortId).populate("organization_id", "name").lean();
  if (!program) throw new NotFoundError("Cohort program not found");
  const isStudent = user.role === "student";
  if (isStudent) return { ...program, applications: undefined, member_count: undefined };
  await requireProgramAccess(program, user);
  return program;
}

export async function applyToCohort(cohortId, student) {
  if (student.role !== "student") throw new ForbiddenError("Only students can apply to cohort programs");
  const program = await CohortProgram.findOne({ _id: cohortId, status: "open", application_deadline: { $gt: new Date() } });
  if (!program) throw new NotFoundError("This cohort is not accepting applications");
  try {
    const application = await CohortApplication.create({ cohort_id: program._id, organization_id: program.organization_id, student_id: student._id });
    await audit(student, "COHORT_APPLICATION_CREATED", "cohort.application_created", program, { studentId: student._id });
    return application;
  } catch (error) {
    if (error.code === 11000) throw new ConflictError("You have already applied to this cohort");
    throw error;
  }
}

export async function listApplications(cohortId, user) {
  const program = await CohortProgram.findById(cohortId).lean();
  if (!program) throw new NotFoundError("Cohort program not found");
  if (user.role === "student") return CohortApplication.findOne({ cohort_id: cohortId, student_id: user._id }).lean();
  await requireProgramAccess(program, user);
  return CohortApplication.find({ cohort_id: cohortId }).populate("student_id", "name email avatarUrl universityVerified").sort({ createdAt: 1 }).lean();
}

export async function acceptApplication(cohortId, applicationId, actor) {
  const program = await CohortProgram.findById(cohortId);
  if (!program) throw new NotFoundError("Cohort program not found");
  await requireProgramAccess(program, actor);
  const application = await CohortApplication.findOne({ _id: applicationId, cohort_id: cohortId, status: "pending" });
  if (!application) throw new NotFoundError("Pending cohort application not found");
  // The seat claim is atomic.  `$lt: "$seats"` is not a field-to-field
  // comparison in a normal Mongo query, so use `$expr` to prevent two
  // concurrent acceptances from exceeding the cohort limit.
  const claimed = await CohortProgram.findOneAndUpdate({ _id: cohortId, status: { $in: ["draft", "open"] }, $expr: { $lt: ["$accepted_count", "$seats"] } }, { $inc: { accepted_count: 1 }, $set: { status: "open" } }, { new: true });
  if (!claimed) throw new ValidationError("All cohort seats have already been allocated");
  try {
    const project = await Project.findById(program.project_id);
    const proposal = await Proposal.create({ project_id: project._id, organization_id: program.organization_id, student_id: application.student_id, price: program.shared_terms.total_amount, currency: program.shared_terms.currency.toLowerCase(), delivery_time_days: program.shared_terms.delivery_time_days, cover_note: `Accepted through cohort program: ${program.name}`, status: "accepted" });
    const terms = { title: program.name, description: program.shared_terms.description, total_amount: program.shared_terms.total_amount, currency: program.shared_terms.currency, delivery_time_days: program.shared_terms.delivery_time_days, deadline: program.application_deadline, payment_terms: "Each cohort student has an independent contract and milestone ledger." };
    const contract = await Contract.create({ proposal_id: proposal._id, project_id: project._id, client_id: project.client_id, organization_id: program.organization_id, student_id: application.student_id, status: "pending_review", version: 1, terms, terms_fingerprint: termsFingerprint(terms) });
    await Milestone.create({ contract_id: contract._id, title: program.shared_terms.milestone_title, description: program.shared_terms.description, amount: program.shared_terms.total_amount, currency: program.shared_terms.currency.toLowerCase(), due_date: program.application_deadline, sequence: 1, deliverables: [{ key: "cohort-delivery", title: "Cohort program deliverables", required: true }] });
    application.status = "accepted"; application.reviewed_by = actor._id; application.reviewed_at = new Date(); application.contract_id = contract._id; await application.save();
    await audit(actor, "COHORT_APPLICATION_ACCEPTED", "cohort.application_accepted", program, { studentId: application.student_id, contractId: contract._id });
    return { application, contract };
  } catch (error) {
    await CohortProgram.updateOne({ _id: cohortId, accepted_count: { $gt: 0 } }, { $inc: { accepted_count: -1 } });
    throw error;
  }
}

export async function getCohortProgress(cohortId, user) {
  const program = await CohortProgram.findById(cohortId).lean();
  if (!program) throw new NotFoundError("Cohort program not found");
  await requireProgramAccess(program, user);
  const applications = await CohortApplication.find({ cohort_id: cohortId }).lean();
  const contractIds = applications.filter((item) => item.contract_id).map((item) => item.contract_id);
  const contracts = await Contract.find({ _id: { $in: contractIds }, organization_id: program.organization_id }).select("_id status student_id").lean();
  const milestones = await Milestone.find({ contract_id: { $in: contractIds } }).select("contract_id status payout_status").lean();
  const payments = await Payment.find({ milestone_id: { $in: milestones.map((item) => item._id) } }).select("milestone_id direction status amount amount_minor currency").lean();
  const succeededDeposits = payments.filter((item) => item.direction === "deposit" && item.status === "succeeded");
  const succeededReleases = payments.filter((item) => item.direction === "release" && item.status === "succeeded");
  const amount = (payment) => payment.amount_minor ?? Math.round(Number(payment.amount || 0) * 100);
  return {
    cohort: program,
    applications: applications.length,
    accepted_students: applications.filter((item) => item.status === "accepted").length,
    active_contracts: contracts.filter((item) => item.status === "active").length,
    completion_rate: contracts.length ? Math.round((contracts.filter((item) => item.status === "completed").length / contracts.length) * 100) : 0,
    milestone_progress: { total: milestones.length, released: milestones.filter((item) => item.status === "released").length, active: milestones.filter((item) => ["funded", "in_progress", "submitted", "delivered", "approved"].includes(item.status)).length },
    payment_status: { funded: succeededDeposits.length, paid: succeededReleases.length, pending: payments.filter((item) => item.status === "pending" || item.status === "ledger_pending").length },
    financial: {
      currency: program.shared_terms.currency,
      contract_count: contracts.length,
      contracted_amount: contracts.length * program.shared_terms.total_amount,
      funded_amount: succeededDeposits.reduce((total, item) => total + amount(item), 0) / 100,
      paid_amount: succeededReleases.reduce((total, item) => total + amount(item), 0) / 100,
      contract_ids: contracts.map((item) => item._id),
    },
  };
}
