import { jest } from "@jest/globals";
import { createStripeMock } from "../helpers/stripeMock.js";

const stripeMock = createStripeMock();
jest.unstable_mockModule("./src/modules/payments/stripe.client.js", () => ({
  stripe: stripeMock,
}));

const request = (await import("supertest")).default;
const { default: app } = await import("../../src/app.js");
const { connectTestDB, clearDB, disconnectTestDB } = await import("../helpers/db.js");
const { createUser, createActiveContractWithMilestone, fundMilestone } = await import(
  "../helpers/fixtures.js"
);
const { default: Payment } = await import("../../src/modules/payments/payments.model.js");
const { default: Milestone } = await import("../../src/modules/milestones/milestones.model.js");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Disputes module", () => {
  it("requires auth to open a dispute on a milestone", async () => {
    const res = await request(app).post("/v1/disputes/milestone/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to view a dispute's evidence", async () => {
    const res = await request(app).get("/v1/disputes/000000000000000000000002/evidence");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to list open disputes", async () => {
    const res = await request(app).get("/v1/disputes");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to list my own disputes", async () => {
    const res = await request(app).get("/v1/disputes/mine");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to resolve a dispute", async () => {
    const res = await request(app)
      .post("/v1/disputes/000000000000000000000003/resolve")
      .send({ outcome: "refund_client" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  describe("Resolving a dispute — escrow outcomes", () => {
    async function openFundedDisputeAsClient() {
      const { user: admin, token: adminToken } = await createUser("admin");
      const { user: client, token: clientToken } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });
      await fundMilestone(milestone);

      const openRes = await request(app)
        .post(`/v1/disputes/milestone/${milestone._id}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ reason: "Deliverable did not match the agreed scope at all." });

      return { admin, adminToken, client, student, milestone, disputeId: openRes.body.data._id };
    }

    it("refunds the client and marks the milestone not_funded on refund_client outcome", async () => {
      const { adminToken, milestone, disputeId } = await openFundedDisputeAsClient();

      stripeMock.refunds.create.mockResolvedValue({ id: "re_test_1" });

      const res = await request(app)
        .post(`/v1/disputes/${disputeId}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ outcome: "refund_client", resolution_summary: "Work did not meet the agreed scope." });

      expect(res.status).toBe(200);
      expect(stripeMock.refunds.create).toHaveBeenCalledTimes(1);

      const refundPayment = await Payment.findOne({ milestone_id: milestone._id, direction: "refund" });
      expect(refundPayment).not.toBeNull();
      expect(refundPayment.status).toBe("succeeded");
      expect(refundPayment.stripe_refund_id).toBe("re_test_1");

      const updatedMilestone = await Milestone.findById(milestone._id);
      expect(updatedMilestone.status).toBe("not_funded");

      const { refundClient } = await import("../../src/modules/payments/payments.service.js");
      const duplicate = await refundClient(milestone._id);
      expect(duplicate._id.toString()).toBe(refundPayment._id.toString());
      expect(stripeMock.refunds.create).toHaveBeenCalledTimes(1);
    });

    it("fails the resolution instead of issuing a phantom refund when no succeeded deposit exists", async () => {
      // Data-integrity edge case: a milestone reaches "funded" status without a
      // corresponding succeeded deposit Payment record (e.g. a prior migration
      // gap or manual status edit). refundClient's guard must reject this
      // rather than call stripe.refunds.create against a non-existent charge.
      const { user: admin, token: adminToken } = await createUser("admin");
      const { user: client, token: clientToken } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });
      milestone.status = "funded";
      await milestone.save();

      const openRes = await request(app)
        .post(`/v1/disputes/milestone/${milestone._id}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ reason: "Deliverable did not match the agreed scope at all." });

      const res = await request(app)
        .post(`/v1/disputes/${openRes.body.data._id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ outcome: "refund_client", resolution_summary: "Work did not meet the agreed scope." });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/No successful deposit found/);
      expect(stripeMock.refunds.create).not.toHaveBeenCalled();

      const dispute = await (await import("../../src/modules/disputes/disputes.model.js")).default.findById(
        openRes.body.data._id
      );
      expect(dispute.status).toBe("open");
    });
  });
});
