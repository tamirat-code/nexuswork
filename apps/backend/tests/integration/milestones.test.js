import { jest } from "@jest/globals";
import { createStripeMock } from "../helpers/stripeMock.js";

const stripeMock = createStripeMock();
jest.unstable_mockModule("../../src/modules/payments/stripe.client.js", () => ({
  stripe: stripeMock,
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../../src/app.js");
const { connectTestDB, clearDB, disconnectTestDB } = await import("../helpers/db.js");
const { createUser, createActiveContractWithMilestone, fundMilestone, createWallet } = await import("../helpers/fixtures.js");
const { default: Milestone } = await import("../../src/modules/milestones/milestones.model.js");
const { default: Payment } = await import("../../src/modules/payments/payments.model.js");
const { default: Contract } = await import("../../src/modules/contracts/contracts.model.js");
const { paymentConfig } = await import("../../src/config/payment.config.js");

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

describe("Milestones module", () => {
  it("requires auth to list milestones for a contract", async () => {
    const res = await request(app).get("/v1/milestones/contract/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to approve a milestone", async () => {
    const res = await request(app).post("/v1/milestones/000000000000000000000002/approve");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects a student attempting release", async () => {
    const { user: client } = await createUser("client");
    const { user: student, token: studentToken } = await createUser("student");
    const { milestone } = await createActiveContractWithMilestone({ client, student });

    const res = await request(app)
      .post(`/v1/milestones/${milestone._id}/release`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();

    expect(res.status).toBe(403);
  });

  describe("Approval and explicit release lifecycle", () => {
    async function fundedAndSubmitted({ amount = 200 } = {}) {
      const { user: client, token: clientToken } = await createUser("client");
      const { user: student } = await createUser("student");
      await createWallet(student, { stripe_account_id: "acct_test_1" });
      const { contract, milestone } = await createActiveContractWithMilestone({
        client,
        student,
        milestoneAmount: amount,
      });
      await fundMilestone(milestone);
      milestone.status = "submitted";
      milestone.delivered_at = new Date();
      await milestone.save();
      return { client, clientToken, student, contract, milestone };
    }

    it("approves without releasing, then releases explicitly", async () => {
      const { clientToken, milestone } = await fundedAndSubmitted({ amount: 200 });

      const res = await request(app)
        .post(`/v1/milestones/${milestone._id}/approve`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Milestone.findById(milestone._id);
      expect(updated.status).toBe("approved");
      expect(updated.payout_status).toBe("pending");
      expect(updated.released_at).toBeNull();
      expect(await Payment.countDocuments({ milestone_id: milestone._id, direction: "release" })).toBe(0);

      stripeMock.accounts.retrieve.mockResolvedValue({ payouts_enabled: true });
      stripeMock.transfers.create.mockResolvedValue({ id: "tr_test_1" });
      const release = await request(app)
        .post(`/v1/milestones/${milestone._id}/release`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();

      expect(release.status).toBe(200);
      const expectedPayout = 200 * (1 - paymentConfig.commissionRate);
      const expectedCommission = 200 - expectedPayout;
      const released = await Milestone.findById(milestone._id);
      expect(released.status).toBe("released");
      expect(released.payout_status).toBe("paid");

      const releasePayment = await Payment.findOne({ milestone_id: milestone._id, direction: "release" });
      expect(releasePayment.status).toBe("succeeded");
      expect(releasePayment.amount).toBeCloseTo(expectedPayout, 2);

      const commissionPayment = await Payment.findOne({ milestone_id: milestone._id, direction: "commission" });
      expect(commissionPayment.status).toBe("succeeded");
      expect(commissionPayment.amount).toBeCloseTo(expectedCommission, 2);
    });

    it("marks the contract completed once its only milestone is released", async () => {
      const { clientToken, contract, milestone } = await fundedAndSubmitted({ amount: 100 });

      await request(app)
        .post(`/v1/milestones/${milestone._id}/approve`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();

      stripeMock.accounts.retrieve.mockResolvedValue({ payouts_enabled: true });
      stripeMock.transfers.create.mockResolvedValue({ id: "tr_test_2" });
      await request(app)
        .post(`/v1/milestones/${milestone._id}/release`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();

      const updatedContract = await Contract.findById(contract._id);
      expect(updatedContract.status).toBe("completed");
    });

    it("marks a provider release failure as release_failed", async () => {
      const { clientToken, milestone } = await fundedAndSubmitted({ amount: 100 });

      await request(app)
        .post(`/v1/milestones/${milestone._id}/approve`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();

      stripeMock.accounts.retrieve.mockResolvedValue({ payouts_enabled: true });
      stripeMock.transfers.create.mockRejectedValue(new Error("provider unavailable"));

      const res = await request(app)
        .post(`/v1/milestones/${milestone._id}/release`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();

      expect(res.status).toBe(200);
      const updated = await Milestone.findById(milestone._id);
      expect(updated.status).toBe("release_failed");
      expect(updated.payout_status).toBe("failed");
      expect(await Payment.findOne({ milestone_id: milestone._id, direction: "release", status: "failed" })).not.toBeNull();
    });

    it("rejects approval by a user who is not the contract's client", async () => {
      const { user: client } = await createUser("client");
      const { user: student, token: studentToken } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });
      await fundMilestone(milestone);
      milestone.status = "submitted";
      await milestone.save();

      const res = await request(app)
        .post(`/v1/milestones/${milestone._id}/approve`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();

      expect(res.status).toBe(403);

      const unchanged = await Milestone.findById(milestone._id);
      expect(unchanged.status).toBe("submitted");
    });

    it("rejects approval of a milestone with no submitted work yet", async () => {
      const { user: client, token: clientToken } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });
      await fundMilestone(milestone); // funded, but never submitted

      const res = await request(app)
        .post(`/v1/milestones/${milestone._id}/approve`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/must have submitted work/);
    });

    it("rejects release before approval and while disputed", async () => {
      const { user: client, token: clientToken } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });

      const unapproved = await request(app)
        .post(`/v1/milestones/${milestone._id}/release`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();
      expect(unapproved.status).toBe(400);

      milestone.status = "disputed";
      await milestone.save();
      const disputed = await request(app)
        .post(`/v1/milestones/${milestone._id}/release`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();
      expect(disputed.status).toBe(400);
    });
  });
});
