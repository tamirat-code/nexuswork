import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db.js";
import { createUser, createActiveContractWithMilestone, fundMilestone } from "../helpers/fixtures.js";
import File from "../../src/modules/files/files.model.js";
import Message from "../../src/modules/messaging/messaging.model.js";
import Invoice from "../../src/modules/invoices/invoices.model.js";
import AuditLog from "../../src/modules/audit-logs/audit-logs.model.js";
import Project from "../../src/modules/projects/projects.model.js";
import User from "../../src/modules/users/users.model.js";
import { RevokedToken } from "../../src/modules/auth/tokens.model.js";
import { authConfig } from "../../src/config/auth.config.js";

beforeAll(connectTestDB);
beforeEach(clearDB);
afterAll(disconnectTestDB);

function fileFor(ownerId, related_type, related_id) {
  return File.create({
    owner_id: ownerId,
    filename: "security-test.txt",
    original_name: "security-test.txt",
    mimetype: "text/plain",
    size: 1,
    url: "/v1/files/content/security-test",
    related_type,
    related_id,
  });
}

describe("resource authorization security boundaries", () => {
  test("rejects revoked, expired, missing-jti, and inactive-user tokens", async () => {
    const { user, token } = await createUser("client");
    const decoded = jwt.decode(token);
    await RevokedToken.create({ jti: decoded.jti, expires_at: new Date(Date.now() + 60000) });
    await request(app).get("/v1/auth/me").set("Authorization", `Bearer ${token}`).expect(401);

    const expired = jwt.sign({ sub: user._id, role: user.role, jti: "expired-test" }, authConfig.jwtSecret, { expiresIn: -1 });
    await request(app).get("/v1/auth/me").set("Authorization", `Bearer ${expired}`).expect(401);

    const missingJti = jwt.sign({ sub: user._id, role: user.role }, authConfig.jwtSecret, { expiresIn: "1h" });
    await request(app).get("/v1/auth/me").set("Authorization", `Bearer ${missingJti}`).expect(401);

    await User.updateOne({ _id: user._id }, { $set: { status: "suspended" } });
    const activeToken = jwt.sign({ sub: user._id, role: user.role, jti: "inactive-test" }, authConfig.jwtSecret, { expiresIn: "1h" });
    await request(app).get("/v1/auth/me").set("Authorization", `Bearer ${activeToken}`).expect(401);
  });

  test("submissions and disputes require the correct contract relationship", async () => {
    const { user: client, token: clientToken } = await createUser("client");
    const { user: student, token: studentToken } = await createUser("student");
    const { user: unrelated, token: unrelatedToken } = await createUser("student");
    const { milestone } = await createActiveContractWithMilestone({ client, student });
    await fundMilestone(milestone);

    await request(app).post(`/v1/milestones/${milestone._id}/submit`).set("Authorization", `Bearer ${studentToken}`).send({ note: "Work submitted" }).expect(200);
    await request(app).get(`/v1/submissions/milestone/${milestone._id}`).set("Authorization", `Bearer ${unrelatedToken}`).expect(403);

    const dispute = await request(app).post(`/v1/disputes/milestone/${milestone._id}`).set("Authorization", `Bearer ${clientToken}`).send({ reason: "A sufficiently detailed dispute reason" }).expect(201);
    expect(dispute.body.data.opened_by).toBe(client._id.toString());
    expect(await AuditLog.countDocuments({ eventType: "DISPUTE_OPENED", entity_id: dispute.body.data._id })).toBe(1);

    await request(app).post(`/v1/disputes/${dispute.body.data._id}/resolve`).set("Authorization", `Bearer ${studentToken}`).send({ outcome: "resume_work" }).expect(403);
    await request(app).post(`/v1/disputes/milestone/${milestone._id}`).set("Authorization", `Bearer ${unrelatedToken}`).send({ reason: "Unauthorized dispute attempt" }).expect(403);
  });

  test("project attachments are not readable merely because the project is open", async () => {
    const { user: owner, token: ownerToken } = await createUser("client");
    const { user: unrelated, token: unrelatedToken } = await createUser("client");
    const project = await Project.create({
      client_id: owner._id,
      title: "Private attachment project",
      description: "Project attachment authorization test",
      budget: 100,
      deadline: new Date(Date.now() + 86400000),
      status: "open",
    });
    const file = await fileFor(owner._id, "project_attachment", project._id);

    await request(app).get(`/v1/files/${file._id}`).set("Authorization", `Bearer ${unrelatedToken}`).expect(403);
    await request(app).get(`/v1/files/${file._id}`).set("Authorization", `Bearer ${ownerToken}`).expect(200);
  });

  test("contract files and messages require contract-party access and record message creation", async () => {
    const { user: client, token: clientToken } = await createUser("client");
    const { user: student, token: studentToken } = await createUser("student");
    const { user: unrelated, token: unrelatedToken } = await createUser("client");
    const { contract } = await createActiveContractWithMilestone({ client, student });
    const file = await fileFor(client._id, "contract", contract._id);
    const message = await Message.create({ contract_id: contract._id, sender_id: client._id, body: "Existing message" });

    await request(app).get(`/v1/files/${file._id}`).set("Authorization", `Bearer ${unrelatedToken}`).expect(403);
    await request(app).get(`/v1/files/${file._id}`).set("Authorization", `Bearer ${studentToken}`).expect(200);
    await request(app).get(`/v1/messaging/contract/${contract._id}`).set("Authorization", `Bearer ${unrelatedToken}`).expect(403);
    await request(app).post(`/v1/messaging/contract/${contract._id}`).set("Authorization", `Bearer ${studentToken}`).send({ body: "Hello" }).expect(201);
    expect(await AuditLog.countDocuments({ eventType: "MESSAGE_CREATED", entity_type: "message" })).toBe(1);
    expect(message.sender_id.toString()).toBe(client._id.toString());
    await request(app).get(`/v1/messaging/contract/${contract._id}`).set("Authorization", `Bearer ${clientToken}`).expect(200);
  });

  test("invoice status changes are client-only and state-validated", async () => {
    const { user: client, token: clientToken } = await createUser("client");
    const { user: student, token: studentToken } = await createUser("student");
    const { contract } = await createActiveContractWithMilestone({ client, student });
    const invoice = await Invoice.create({
      contract_id: contract._id,
      client_id: client._id,
      student_id: student._id,
      invoice_number: "INV-SECURITY-1",
      amount: 100,
      line_items: [{ description: "Work", quantity: 1, unit_price: 100 }],
      status: "draft",
    });

    await request(app).patch(`/v1/invoices/${invoice._id}`).set("Authorization", `Bearer ${studentToken}`).send({ status: "sent" }).expect(403);
    await request(app).patch(`/v1/invoices/${invoice._id}`).set("Authorization", `Bearer ${clientToken}`).send({ status: "paid", clientId: student._id }).expect(400);
    const updated = await request(app).patch(`/v1/invoices/${invoice._id}`).set("Authorization", `Bearer ${clientToken}`).send({ status: "sent", clientId: student._id }).expect(200);
    expect(updated.body.data.status).toBe("sent");
    expect(await AuditLog.countDocuments({ eventType: "INVOICE_STATUS_UPDATED", entity_id: invoice._id })).toBe(1);
  });
});
