import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db.js";
import { createUser, createActiveContractWithMilestone, fundMilestone } from "../helpers/fixtures.js";
import Milestone from "../../src/modules/milestones/milestones.model.js";
import Payment from "../../src/modules/payments/payments.model.js";
import Contract from "../../src/modules/contracts/contracts.model.js";
import { paymentConfig } from "../../src/config/payment.config.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearDB();
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

  describe("Approval-triggered release and commission calculation", () => {
    async function fundedAndSubmitted({ amount = 200 } = {}) {
      const { user: client, token: clientToken } = await createUser("client");
      const { user: student } = await createUser("student");
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

    it("releases the payout minus commission and records both as Payments", async () => {
      const { clientToken, milestone } = await fundedAndSubmitted({ amount: 200 });

      const res = await request(app)
        .post(`/v1/milestones/${milestone._id}/approve`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const expectedPayout = 200 * (1 - paymentConfig.commissionRate);
      const expectedCommission = 200 - expectedPayout;

      const updated = await Milestone.findById(milestone._id);
      expect(updated.status).toBe("released");
      expect(updated.payout_status).toBe("paid");
      expect(updated.released_at).not.toBeNull();

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

      const updatedContract = await Contract.findById(contract._id);
      expect(updatedContract.status).toBe("completed");
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
  });
});