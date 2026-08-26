import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db.js";
import { createUser, createActiveContractWithMilestone, fundMilestone } from "../helpers/fixtures.js";
import Project from "../../src/modules/projects/projects.model.js";
import Proposal from "../../src/modules/proposals/proposals.model.js";
import Contract from "../../src/modules/contracts/contracts.model.js";
import Milestone from "../../src/modules/milestones/milestones.model.js";
import AuditLog from "../../src/modules/audit-logs/audit-logs.model.js";
import { buildContractTerms } from "../../src/modules/contracts/contracts.service.js";

beforeAll(connectTestDB);
beforeEach(clearDB);
afterAll(disconnectTestDB);

async function createReviewableContract(client, student) {
  const project = await Project.create({
    client_id: client._id,
    title: "Authorization contract",
    description: "Authorization contract description",
    budget: 100,
    deadline: new Date(Date.now() + 86400000),
    status: "in_progress",
  });
  const proposal = await Proposal.create({
    project_id: project._id,
    student_id: student._id,
    price: 100,
    delivery_time_days: 7,
    cover_note: "Authorization proposal",
    status: "accepted",
  });
  const { terms, terms_fingerprint } = buildContractTerms({ project, proposal });
  return Contract.create({
    proposal_id: proposal._id,
    project_id: project._id,
    client_id: client._id,
    student_id: student._id,
    status: "pending_review",
    version: 1,
    terms,
    terms_fingerprint,
  });
}

describe("contract and milestone authorization integration", () => {
  test("contract transitions create authenticated audit events with correlation IDs", async () => {
    const { user: client, token: clientToken } = await createUser("client");
    const { user: student, token: studentToken } = await createUser("student");
    const contract = await createReviewableContract(client, student);

    const unrelated = await createUser("client");
    const denied = await request(app)
      .post(`/v1/contracts/${contract._id}/review`)
      .set("Authorization", `Bearer ${unrelated.token}`)
      .send({ userId: client._id, role: "client" });
    expect(denied.status).toBe(403);
    expect(await AuditLog.countDocuments({ entity_id: contract._id, eventType: "CONTRACT_REVIEWED" })).toBe(0);

    await request(app).post(`/v1/contracts/${contract._id}/review`).set("Authorization", `Bearer ${clientToken}`).send().expect(200);
    await request(app).post(`/v1/contracts/${contract._id}/review`).set("Authorization", `Bearer ${studentToken}`).send().expect(200);
    await request(app).post(`/v1/contracts/${contract._id}/sign`).set("Authorization", `Bearer ${clientToken}`).send().expect(400);
    await request(app).post(`/v1/contracts/${contract._id}/sign`).set("Authorization", `Bearer ${clientToken}`).send({ confirm_terms: true }).expect(200);
    await request(app).post(`/v1/contracts/${contract._id}/sign`).set("Authorization", `Bearer ${studentToken}`).send({ confirm_terms: true }).expect(200);

    const events = await AuditLog.find({ entity_id: contract._id }).sort({ createdAt: 1 }).lean();
    const activated = events.find((event) => event.eventType === "CONTRACT_ACTIVATED");
    expect(activated.actor_id.toString()).toBe(student._id.toString());
    expect(activated.correlationId).toBeTruthy();
    expect(activated.previousState).toBe("pending_signature");
    expect(activated.newState).toBe("active");
  });

  test("milestone authorization and audit events preserve actor and state transitions", async () => {
    const { user: client, token: clientToken } = await createUser("client");
    const { user: student, token: studentToken } = await createUser("student");
    const { user: otherClient, token: otherClientToken } = await createUser("client");
    const { milestone } = await createActiveContractWithMilestone({ client, student });
    await fundMilestone(milestone);

    const beforeDenied = await AuditLog.countDocuments({ entity_id: milestone._id, eventType: "MILESTONE_APPROVED" });
    const denied = await request(app)
      .post(`/v1/milestones/${milestone._id}/approve`)
      .set("Authorization", `Bearer ${otherClientToken}`)
      .send({ userId: client._id });
    expect(denied.status).toBe(403);
    expect(await AuditLog.countDocuments({ entity_id: milestone._id, eventType: "MILESTONE_APPROVED" })).toBe(beforeDenied);

    const submit = await request(app)
      .post(`/v1/milestones/${milestone._id}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ note: "Submitted work" });
    expect(submit.status).toBe(200);

    const approve = await request(app)
      .post(`/v1/milestones/${milestone._id}/approve`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send();
    expect(approve.status).toBe(200);

    const submitted = await AuditLog.findOne({ entity_id: milestone._id, eventType: "MILESTONE_SUBMITTED" }).lean();
    const approved = await AuditLog.findOne({ entity_id: milestone._id, eventType: "MILESTONE_APPROVED" }).lean();
    expect(submitted.actor_id.toString()).toBe(student._id.toString());
    expect(submitted.correlationId).toBeTruthy();
    expect(submitted.previousState).toBe("funded");
    expect(submitted.newState).toBe("submitted");
    expect(approved.actor_id.toString()).toBe(client._id.toString());
    expect(approved.previousState).toBe("submitted");
    expect(approved.newState).toBe("approved");
  });
});
