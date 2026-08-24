import { jest } from "@jest/globals";
import { createStripeMock } from "../helpers/stripeMock.js";

// Must be registered before any module that transitively imports stripe.client.js
// is imported (native ESM mocking — see jest docs on unstable_mockModule).
const stripeMock = createStripeMock();
jest.unstable_mockModule("../../src/modules/payments/stripe.client.js", () => ({
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
const { default: WebhookEvent } = await import("../../src/modules/webhooks/webhookEvent.model.js");

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

describe("Payments module", () => {
  it("requires auth to view personal payments", async () => {
    const res = await request(app).get("/v1/payments");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  describe("Milestone funding (deposit intent creation)", () => {
    it("creates a pending deposit Payment when the client funds a milestone", async () => {
      const { user: client, token: clientToken } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({
        client,
        student,
        milestoneAmount: 250,
      });

      stripeMock.paymentIntents.create.mockResolvedValue({
        id: "pi_test_123",
        client_secret: "pi_test_123_secret",
      });

      const res = await request(app)
        .post(`/v1/milestones/${milestone._id}/fund`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(stripeMock.paymentIntents.create).toHaveBeenCalledTimes(1);
      expect(stripeMock.paymentIntents.create.mock.calls[0][0]).toMatchObject({
        amount: 25000, // $250.00 in cents
      });

      const payment = await Payment.findOne({ stripe_payment_intent_id: "pi_test_123" });
      expect(payment).not.toBeNull();
      expect(payment.direction).toBe("deposit");
      expect(payment.status).toBe("pending");
      expect(payment.amount).toBe(250);

      const updatedMilestone = await Milestone.findById(milestone._id);
      expect(updatedMilestone.status).toBe("funding_pending");
    });

    it("rejects funding by a user who is not the contract's client", async () => {
      const { user: client } = await createUser("client");
      const { user: student, token: studentToken } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });

      const res = await request(app)
        .post(`/v1/milestones/${milestone._id}/fund`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
    });

    it("rejects funding a milestone that is already funded", async () => {
      const { user: client, token: clientToken } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });
      await fundMilestone(milestone);

      const res = await request(app)
        .post(`/v1/milestones/${milestone._id}/fund`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot fund a milestone in status/);
    });
  });

  describe("Stripe webhook — deposit outcomes", () => {
    it("marks the deposit failed and leaves the milestone unfunded on a declined card", async () => {
      const { user: client } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });

      const payment = await Payment.create({
        milestone_id: milestone._id,
        amount: milestone.amount,
        currency: "usd",
        direction: "deposit",
        status: "pending",
        stripe_payment_intent_id: "pi_declined_1",
      });

      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: "evt_declined_1",
        type: "payment_intent.payment_failed",
        data: { object: { id: "pi_declined_1" } },
      });

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "test-sig")
        .send({ irrelevant: "raw body content, ignored by the mock" });

      expect(res.status).toBe(200);

      const updated = await Payment.findById(payment._id);
      expect(updated.status).toBe("failed");

      const unchangedMilestone = await Milestone.findById(milestone._id);
      expect(unchangedMilestone.status).toBe("not_funded");
    });

    it("captures the specific decline reason for an insufficient-funds card", async () => {
      const { user: client } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });

      const payment = await Payment.create({
        milestone_id: milestone._id,
        amount: milestone.amount,
        currency: "usd",
        direction: "deposit",
        status: "pending",
        stripe_payment_intent_id: "pi_insufficient_1",
      });

      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: "evt_insufficient_1",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_insufficient_1",
            last_payment_error: {
              code: "card_declined",
              decline_code: "insufficient_funds",
              message: "Your card has insufficient funds.",
            },
          },
        },
      });

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "test-sig")
        .send({ irrelevant: "raw body content, ignored by the mock" });

      expect(res.status).toBe(200);

      const updated = await Payment.findById(payment._id);
      expect(updated.status).toBe("failed");
      expect(updated.failure_code).toBe("insufficient_funds");
      expect(updated.failure_message).toMatch(/insufficient funds/i);
    });

    it("captures a distinct decline reason for an expired card, not confused with insufficient funds", async () => {
      const { user: client } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });

      const payment = await Payment.create({
        milestone_id: milestone._id,
        amount: milestone.amount,
        currency: "usd",
        direction: "deposit",
        status: "pending",
        stripe_payment_intent_id: "pi_expired_1",
      });

      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: "evt_expired_1",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_expired_1",
            last_payment_error: {
              code: "expired_card",
              message: "Your card has expired.",
            },
          },
        },
      });

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "test-sig")
        .send({ irrelevant: "raw body content, ignored by the mock" });

      expect(res.status).toBe(200);

      const updated = await Payment.findById(payment._id);
      expect(updated.status).toBe("failed");
      expect(updated.failure_code).toBe("expired_card");
      expect(updated.failure_code).not.toBe("insufficient_funds");
      expect(updated.failure_message).toMatch(/expired/i);
    });

    it("marks the deposit succeeded and funds the milestone on payment_intent.succeeded", async () => {
      const { user: client } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });

      await Payment.create({
        milestone_id: milestone._id,
        amount: milestone.amount,
        currency: "usd",
        direction: "deposit",
        status: "pending",
        stripe_payment_intent_id: "pi_success_1",
      });

      stripeMock.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_success_1",
        status: "succeeded",
        amount: 10000,
        amount_received: 10000,
        currency: "usd",
        metadata: { milestone_id: String(milestone._id) },
      });

      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: "evt_success_1",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_success_1" } },
      });

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "test-sig")
        .send({ irrelevant: "raw body content, ignored by the mock" });

      expect(res.status).toBe(200);

      const updatedMilestone = await Milestone.findById(milestone._id);
      expect(updatedMilestone.status).toBe("funded");
      expect(updatedMilestone.funded_at).not.toBeNull();

      const duplicate = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "test-sig")
        .send({ irrelevant: "duplicate" });

      expect(duplicate.status).toBe(200);
      expect(duplicate.body.duplicate).toBe(true);
      expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledTimes(1);
    });

    it("rejects a webhook whose signature fails verification", async () => {
      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw new Error("signature mismatch");
      });

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "bad-sig")
        .send({ anything: true });

      expect(res.status).toBe(400);
    });

    it("reclaims a stale processing webhook event", async () => {
      const { user: client } = await createUser("client");
      const { user: student } = await createUser("student");
      const { milestone } = await createActiveContractWithMilestone({ client, student });
      const payment = await Payment.create({
        milestone_id: milestone._id,
        amount: milestone.amount,
        currency: "usd",
        direction: "deposit",
        status: "pending",
        stripe_payment_intent_id: "pi_stale_1",
      });
      await WebhookEvent.create({
        event_id: "evt_stale_1",
        type: "payment_intent.payment_failed",
        status: "processing",
        processing_at: new Date(Date.now() - 10 * 60 * 1000),
      });

      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: "evt_stale_1",
        type: "payment_intent.payment_failed",
        data: { object: { id: "pi_stale_1" } },
      });

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "test-sig")
        .send({ stale: true });

      expect(res.status).toBe(200);
      expect((await Payment.findById(payment._id)).status).toBe("failed");
      expect((await WebhookEvent.findOne({ event_id: "evt_stale_1" })).status).toBe("succeeded");
    });
  });
});
