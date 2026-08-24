import { jest } from "@jest/globals";
import { createStripeMock } from "../helpers/stripeMock.js";

const stripeMock = createStripeMock();
jest.unstable_mockModule("../../src/modules/payments/stripe.client.js", () => ({
  stripe: stripeMock,
}));

const request = (await import("supertest")).default;
const { default: app } = await import("../../src/app.js");
const { connectTestDB, clearDB, disconnectTestDB } = await import("../helpers/db.js");
const { createUser, createWallet, createActiveContractWithMilestone, fundMilestone } = await import(
  "../helpers/fixtures.js"
);
const { default: Withdrawal } = await import("../../src/modules/wallets/withdrawal.model.js");

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

function payoutReadyAccount(overrides = {}) {
  return {
    id: "acct_test_1",
    charges_enabled: true,
    payouts_enabled: true,
    details_submitted: true,
    requirements: { currently_due: [], disabled_reason: null },
    ...overrides,
  };
}

describe("Wallets module — withdrawals", () => {
  it("requires auth to request a withdrawal", async () => {
    const res = await request(app).post("/v1/wallets/me/withdrawals").send({ amount: 10 });
    expect(res.status).toBe(401);
  });

  it("rejects a withdrawal when payout setup was never completed", async () => {
    const { user: student, token } = await createUser("student");
    await createWallet(student); // no stripe_account_id

    const res = await request(app)
      .post("/v1/wallets/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 10 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/payout account setup/);
    expect(await Withdrawal.countDocuments()).toBe(0);
  });

  it("rejects a withdrawal that exceeds the available wallet balance (insufficient funds)", async () => {
    const { user: student, token } = await createUser("student");
    await createWallet(student, { stripe_account_id: "acct_test_1" });
    stripeMock.accounts.retrieve.mockResolvedValue(payoutReadyAccount());

    // No released milestone payments exist yet, so available balance is 0.
    const res = await request(app)
      .post("/v1/wallets/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient wallet balance/);
    expect(res.body.message).toMatch(/0\.00/);
    // No Withdrawal record should be created for a balance check that fails
    // before the withdrawal is opened.
    expect(await Withdrawal.countDocuments()).toBe(0);
  });

  it("rejects a withdrawal when the platform's own Stripe balance can't cover it yet", async () => {
    const { user: client } = await createUser("client");
    const { user: student, token } = await createUser("student");
    const { milestone } = await createActiveContractWithMilestone({
      client,
      student,
      milestoneAmount: 100,
    });
    await fundMilestone(milestone);
    milestone.status = "submitted";
    await milestone.save();

    await createWallet(student, { stripe_account_id: "acct_test_1" });
    stripeMock.accounts.retrieve.mockResolvedValue(payoutReadyAccount());

    // Release the milestone directly via the service-level effect so the
    // student's internal wallet balance is non-zero, without needing to
    // exercise the approve endpoint again here.
    const { default: Payment } = await import("../../src/modules/payments/payments.model.js");
    await Payment.create({
      milestone_id: milestone._id,
      amount: 90,
      currency: "usd",
      direction: "release",
      status: "succeeded",
    });

    // Platform's Stripe balance is short — simulates card funds not having
    // settled yet (Stripe's real-world 2-business-day availability delay).
    stripeMock.balance.retrieve.mockResolvedValue({ available: [{ amount: 0, currency: "usd" }] });

    const res = await request(app)
      .post("/v1/wallets/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Withdrawal failed/);
    expect(res.body.message).toMatch(/does not have enough available funds/);

    const withdrawal = await Withdrawal.findOne({ user_id: student._id });
    expect(withdrawal).not.toBeNull();
    expect(withdrawal.status).toBe("failed");
    expect(withdrawal.failure_reason).toMatch(/does not have enough available funds/);
  });

  it("marks the withdrawal failed when the Stripe transfer call itself is rejected", async () => {
    const { user: client } = await createUser("client");
    const { user: student, token } = await createUser("student");
    const { milestone } = await createActiveContractWithMilestone({
      client,
      student,
      milestoneAmount: 100,
    });
    await fundMilestone(milestone);

    await createWallet(student, { stripe_account_id: "acct_test_1" });
    stripeMock.accounts.retrieve.mockResolvedValue(payoutReadyAccount());

    const { default: Payment } = await import("../../src/modules/payments/payments.model.js");
    await Payment.create({
      milestone_id: milestone._id,
      amount: 90,
      currency: "usd",
      direction: "release",
      status: "succeeded",
    });

    // Balance checks pass, but Stripe itself rejects the transfer — e.g. the
    // destination account was restricted between onboarding and withdrawal.
    stripeMock.balance.retrieve.mockResolvedValue({ available: [{ amount: 100000, currency: "usd" }] });
    stripeMock.transfers.create.mockRejectedValue(new Error("destination account is currently restricted"));

    const res = await request(app)
      .post("/v1/wallets/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Withdrawal failed/);
    expect(res.body.message).toMatch(/restricted/);

    const withdrawal = await Withdrawal.findOne({ user_id: student._id });
    expect(withdrawal).not.toBeNull();
    expect(withdrawal.status).toBe("failed");
    expect(withdrawal.failure_reason).toMatch(/restricted/);
  });

  it("succeeds when funds are available on both the wallet and the platform balance", async () => {
    const { user: client } = await createUser("client");
    const { user: student, token } = await createUser("student");
    const { milestone } = await createActiveContractWithMilestone({
      client,
      student,
      milestoneAmount: 100,
    });
    await fundMilestone(milestone);

    await createWallet(student, { stripe_account_id: "acct_test_1" });
    stripeMock.accounts.retrieve.mockResolvedValue(payoutReadyAccount());

    const { default: Payment } = await import("../../src/modules/payments/payments.model.js");
    await Payment.create({
      milestone_id: milestone._id,
      amount: 90,
      currency: "usd",
      direction: "release",
      status: "succeeded",
    });

    stripeMock.balance.retrieve.mockResolvedValue({ available: [{ amount: 100000, currency: "usd" }] });
    stripeMock.transfers.create.mockResolvedValue({ id: "tr_test_1" });

    const res = await request(app)
      .post("/v1/wallets/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50 });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("paid");
    expect(res.body.data.stripe_payout_id).toBe("tr_test_1");
  });

  it("returns the original withdrawal for a duplicate idempotency key", async () => {
    const { user: client } = await createUser("client");
    const { user: student, token } = await createUser("student");
    const { milestone } = await createActiveContractWithMilestone({ client, student, milestoneAmount: 100 });
    await fundMilestone(milestone);

    await createWallet(student, { stripe_account_id: "acct_test_1" });
    stripeMock.accounts.retrieve.mockResolvedValue(payoutReadyAccount());
    stripeMock.balance.retrieve.mockResolvedValue({ available: [{ amount: 100000, currency: "usd" }] });
    stripeMock.transfers.create.mockResolvedValue({ id: "tr_idempotent_1" });

    await (await import("../../src/modules/payments/payments.model.js")).default.create({
      milestone_id: milestone._id,
      amount: 90,
      currency: "usd",
      direction: "release",
      status: "succeeded",
    });

    const first = await request(app)
      .post("/v1/wallets/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "withdrawal-test-key-1")
      .send({ amount: 50 });
    const second = await request(app)
      .post("/v1/wallets/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "withdrawal-test-key-1")
      .send({ amount: 50 });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data._id).toBe(first.body.data._id);
    expect(stripeMock.transfers.create).toHaveBeenCalledTimes(1);
  });
});
