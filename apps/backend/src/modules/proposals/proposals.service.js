import Proposal from "./proposals.model.js";
import Project from "../projects/projects.model.js";
import Contract from "../contracts/contracts.model.js";
import StudentProfile from "../students/students.model.js";
import { isOrgMember } from "../clients/clients.service.js";
import { createNotification } from "../notifications/notifications.service.js";

export async function submitProposal(studentId, data) {
  const project = await Project.findById(data.project_id);
  if (!project || project.status !== "open") {
    const err = new Error("Project is not open for proposals");
    err.status = 400;
    throw err;
  }

  
  const profile = await StudentProfile.findOne({ user_id: studentId });
  if (!profile || profile.verification_status !== "verified") {
    const err = new Error("Your university verification must be approved before you can submit proposals");
    err.status = 403;
    throw err;
  }

  const proposal = await Proposal.create({ ...data, student_id: studentId });

  // Notify only the project's client — never broadcast to everyone.
  try {
    await createNotification({
      userId: project.client_id,
      type: "proposal_received",
      title: "New proposal received",
      body: `A student submitted a proposal for "${project.title}".`,
      data: { project_id: project._id, proposal_id: proposal._id },
    });
  } catch (err) {
    // Notification failure must not block the proposal submission.
    console.error("[proposals] failed to notify client:", err.message);
  }

  return proposal;
}

export async function listForUser(userId, role) {
  // Students see the proposals they submitted.
  if (role === "student") {
    return Proposal.find({ student_id: userId }).sort({ createdAt: -1 });
  }

  // Clients see proposals on projects they own (or org members).
  const ownedProjects = await Project.find({ client_id: userId }).select("_id");
  const projectIds = ownedProjects.map((p) => p._id);
  return Proposal.find({ project_id: { $in: projectIds } }).sort({ createdAt: -1 });
}

export async function listForProject(projectId, requestingUser) {
  const project = await Project.findById(projectId);
  if (!project) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }
  if (String(project.client_id) !== String(requestingUser._id) && requestingUser.role !== "admin") {
    const allowed = await isOrgMember(project.client_id, requestingUser._id);
    if (!allowed) {
      const err = new Error("Not authorized to view these proposals");
      err.status = 403;
      throw err;
    }
  }
  return Proposal.find({ project_id: projectId }).sort({ createdAt: -1 });
}


export async function acceptProposal(proposalId, requestingUser) {
  const proposal = await Proposal.findById(proposalId).populate("project_id");
  if (!proposal) {
    const err = new Error("Proposal not found");
    err.status = 404;
    throw err;
  }
  const project = proposal.project_id;
  if (String(project.client_id) !== String(requestingUser._id)) {
    const allowed = await isOrgMember(project.client_id, requestingUser._id);
    if (!allowed) {
      const err = new Error("Not authorized to accept this proposal");
      err.status = 403;
      throw err;
    }
  }
  proposal.status = "accepted";
  await proposal.save();
  project.status = "in_progress";
  await project.save();
  await Proposal.updateMany(
    { project_id: project._id, _id: { $ne: proposal._id }, status: "pending" },
    { status: "rejected" }
  );
  const contract = await Contract.create({
    proposal_id: proposal._id,
    project_id: project._id,
    client_id: project.client_id,
    student_id: proposal.student_id,
  });
  return { proposal, contract };
}