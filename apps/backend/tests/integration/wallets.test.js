import { jest } from "@jest/globals";
import mongoose from "mongoose";
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
const {
  ensureWithdrawalIndexes,
  LEGACY_WITHDRAWAL_IDEMPOTENCY_INDEX,
  WITHDRAWAL_IDEMPOTENCY_INDEX,
} = await import("../../src/config/database.indexes.js");

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
  it("upgrades the legacy global idempotency index to the per-user compound index idempotently", async () => {
    const collection = Withdrawal.collection;
    await collection.dropIndex(WITHDRAWAL_IDEMPOTENCY_INDEX).catch(() => {});
    await collection.createIndex({ idempotency_key: 1 }, {
      unique: true,
      name: LEGACY_WITHDRAWAL_IDEMPOTENCY_INDEX,
    });

    const before = await collection.listIndexes().toArray();
    expect(before.find((index) => index.name === LEGACY_WITHDRAWAL_IDEMPOTENCY_INDEX)).toMatchObject({
      key: { idempotency_key: 1 },
      unique: true,
    });

    const first = await ensureWithdrawalIndexes();
    const second = await ensureWithdrawalIndexes();
    const after = await collection.listIndexes().toArray();

    expect(first.removed).toEqual([
      expect.objectContaining({ name: LEGACY_WITHDRAWAL_IDEMPOTENCY_INDEX, key: { idempotency_key: 1 }, unique: true }),
    ]);
    expect(first.created).toBe(true);
    expect(second.removed).toEqual([]);
    expect(after.find((index) => index.name === LEGACY_WITHDRAWAL_IDEMPOTENCY_INDEX)).toBeUndefined();
    expect(after.find((index) => index.name === WITHDRAWAL_IDEMPOTENCY_INDEX)).toMatchObject({
      key: { user_id: 1, idempotency_key: 1 },
      unique: true,
    });

    const sharedKey = "cross-user-index-key";
    await Withdrawal.create([
      { user_id: new mongoose.Types.ObjectId(), amount: 1, idempotency_key: sharedKey },
      { user_id: new mongoose.Types.ObjectId(), amount: 1, idempotency_key: sharedKey },
    ]);
  });

  it("backfills missing legacy keys without changing financial fields", async () => {
    const collection = Withdrawal.collection;
    await collection.dropIndex(WITHDRAWAL_IDEMPOTENCY_INDEX).catch(() => {});
    const userId = new mongoose.Types.ObjectId();
    const firstId = new mongoose.Types.ObjectId();
    const secondId = new mongoose.Types.ObjectId();
    await collection.insertMany([
      {
        _id: firstId, user_id: userId, amount: 600, currency: "usd", status: "failed",
        failure_reason: "historical failure", createdAt: new Date("2026-08-21T12:49:55.728Z"),
      },
      {
        _id: secondId, user_id: userId, amount: 600, currency: "usd", status: "paid",
        stripe_payout_id: "simulated_legacy_payout", createdAt: new Date("2026-08-22T10:33:28.951Z"),
      },
    ]);
    const first = { _id: firstId, user_id: userId };
    const second = { _id: secondId, user_id: userId };

    const before = await Withdrawal.find({ _id: { $in: [first._id, second._id] } }).lean();
    const result = await ensureWithdrawalIndexes();
    const after = await Withdrawal.find({ _id: { $in: [first._id, second._id] } }).lean();

    expect(result.backfilled).toBe(2);
    expect(after.map((item) => item.idempotency_key).sort()).toEqual([
      `legacy-withdrawal-${first._id}`,
      `legacy-withdrawal-${second._id}`,
    ].sort());
    for (const original of before) {
      const migrated = after.find((item) => String(item._id) === String(original._id));
      expect(migrated.status).toBe(original.status);
      expect(migrated.amount).toBe(original.amount);
      expect(migrated.user_id).toEqual(original.user_id);
      expect(migrated.stripe_payout_id || null).toBe(original.stripe_payout_id || null);
      expect(migrated.createdAt).toEqual(original.createdAt);
    }
    expect((await ensureWithdrawalIndexes()).backfilled).toBe(0);
  });

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

  it("rejects a withdrawal when the connected Stripe balance can't cover it yet", async () => {
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

    // The connected account's Stripe balance is short.
    stripeMock.balance.retrieve.mockResolvedValue({ available: [{ amount: 0, currency: "usd" }] });

    const res = await request(app)
      .post("/v1/wallets/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Withdrawal failed/);
    expect(res.body.message).toMatch(/connected Stripe account does not have enough available funds/);

    const withdrawal = await Withdrawal.findOne({ user_id: student._id });
    expect(withdrawal).not.toBeNull();
    expect(withdrawal.status).toBe("failed");
    expect(withdrawal.failure_reason).toMatch(/does not have enough available funds/);
  });

  it("marks the withdrawal failed when the Stripe payout call itself is rejected", async () => {
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

    // Balance checks pass, but Stripe itself rejects the payout — e.g. the
    // destination account was restricted between onboarding and withdrawal.
    stripeMock.balance.retrieve.mockResolvedValue({ available: [{ amount: 100000, currency: "usd" }] });
    stripeMock.payouts.create.mockRejectedValue(new Error("destination account is currently restricted"));

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

  it("creates a paid payout from the connected account when Stripe returns paid", async () => {
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
    stripeMock.payouts.create.mockResolvedValue({ id: "po_test_1", status: "paid" });

    const res = await request(app)
      .post("/v1/wallets/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50 });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("paid");
    expect(res.body.data.stripe_payout_id).toBe("po_test_1");
    expect(stripeMock.balance.retrieve).toHaveBeenCalledWith(
      {},
      { stripeAccount: "acct_test_1" }
    );
    const [payoutParams, payoutRequestOptions] = stripeMock.payouts.create.mock.calls[0];
    expect(payoutParams).toEqual(expect.objectContaining({ amount: 5000, currency: "usd" }));
    expect(payoutParams).not.toHaveProperty("stripeAccount");
    expect(payoutRequestOptions).toEqual(expect.objectContaining({
      stripeAccount: "acct_test_1",
    }));
    expect(stripeMock.transfers.create).not.toHaveBeenCalled();
  });

  it("returns the original withdrawal for a duplicate idempotency key", async () => {
    const { user: client } = await createUser("client");
    const { user: student, token } = await createUser("student");
    const { milestone } = await createActiveContractWithMilestone({ client, student, milestoneAmount: 100 });
    await fundMilestone(milestone);

    await createWallet(student, { stripe_account_id: "acct_test_1" });
    stripeMock.accounts.retrieve.mockResolvedValue(payoutReadyAccount());
    stripeMock.balance.retrieve.mockResolvedValue({ available: [{ amount: 100000, currency: "usd" }] });
    stripeMock.payouts.create.mockResolvedValue({ id: "po_idempotent_1", status: "paid" });

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
    expect(stripeMock.payouts.create).toHaveBeenCalledTimes(1);
  });

  it("keeps a Stripe-pending payout pending and reserves it", async () => {
    const { user: client } = await createUser("client");
    const { user: student, token } = await createUser("student");
    const { milestone } = await createActiveContractWithMilestone({ client, student, milestoneAmount: 100 });
    await fundMilestone(milestone);
    await createWallet(student, { stripe_account_id: "acct_test_1" });
    stripeMock.accounts.retrieve.mockResolvedValue(payoutReadyAccount());
    stripeMock.balance.retrieve.mockResolvedValue({ available: [{ amount: 9000, currency: "usd" }] });
    stripeMock.payouts.create.mockResolvedValue({ id: "po_pending_1", status: "pending" });
    await (await import("../../src/modules/payments/payments.model.js")).default.create({
      milestone_id: milestone._id, amount: 90, currency: "usd", direction: "release", status: "succeeded",
    });

    const res = await request(app)
      .post("/v1/wallets/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50 });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect((await Withdrawal.findById(res.body.data._id)).status).toBe("pending");
  });

  it("restores withdrawable balance when a payout fails", async () => {
    const { user: client } = await createUser("client");
    const { user: student } = await createUser("student");
    await createWallet(student, { stripe_account_id: "acct_test_1" });
    const { milestone } = await createActiveContractWithMilestone({ client, student, milestoneAmount: 100 });
    await (await import("../../src/modules/payments/payments.model.js")).default.create({
      milestone_id: milestone._id, amount: 90, currency: "usd", direction: "release", status: "succeeded",
    });
    stripeMock.accounts.retrieve.mockResolvedValue(payoutReadyAccount());
    const withdrawal = await Withdrawal.create({
      user_id: student._id, amount: 50, currency: "usd", status: "pending",
      stripe_payout_id: "po_failed_1", idempotency_key: "failed-payout-key",
    });
    stripeMock.webhooks.constructEvent.mockReturnValue({
      id: "evt_payout_failed_1", type: "payout.failed", account: "acct_test_1",
      data: { object: { id: "po_failed_1", status: "failed", failure_code: "account_closed", metadata: { withdrawal_id: String(withdrawal._id) } } },
    });

    const res = await request(app).post("/webhooks/stripe").set("stripe-signature", "test-sig").send("{}");
    expect(res.status).toBe(200);
    const updated = await Withdrawal.findById(withdrawal._id);
    expect(updated.status).toBe("failed");
    expect(updated.failure_reason).toBe("account_closed");
    const { getBalance } = await import("../../src/modules/wallets/wallets.service.js");
    expect((await getBalance(student._id)).available).toBe(90);
  });

  it("applies payout pending then paid webhook transitions", async () => {
    const { user: student } = await createUser("student");
    await createWallet(student, { stripe_account_id: "acct_test_1" });
    const withdrawal = await Withdrawal.create({
      user_id: student._id, amount: 50, currency: "usd", status: "pending",
      stripe_payout_id: "po_lifecycle_1", idempotency_key: "lifecycle-key",
    });
    for (const [type, status, eventId] of [["payout.created", "pending", "evt_created_1"], ["payout.paid", "paid", "evt_paid_1"]]) {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: eventId, type, account: "acct_test_1",
        data: { object: { id: "po_lifecycle_1", status, metadata: { withdrawal_id: String(withdrawal._id) } } },
      });
      expect((await request(app).post("/webhooks/stripe").set("stripe-signature", "test-sig").send("{}")).status).toBe(200);
      expect((await Withdrawal.findById(withdrawal._id)).status).toBe(status);
    }
  });

  it("does not expose another user's withdrawal or accept its payout webhook", async () => {
    const { user: first } = await createUser("student");
    const { user: second, token } = await createUser("student");
    await createWallet(first, { stripe_account_id: "acct_first" });
    await createWallet(second, { stripe_account_id: "acct_second" });
    const withdrawal = await Withdrawal.create({
      user_id: first._id, amount: 50, currency: "usd", status: "pending",
      stripe_payout_id: "po_cross_user", idempotency_key: "cross-user-key",
    });
    const list = await request(app).get("/v1/wallets/me/transactions").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(0);

    stripeMock.webhooks.constructEvent.mockReturnValue({
      id: "evt_cross_user", type: "payout.paid", account: "acct_second",
      data: { object: { id: "po_cross_user", status: "paid", metadata: { withdrawal_id: String(withdrawal._id) } } },
    });
    expect((await request(app).post("/webhooks/stripe").set("stripe-signature", "test-sig").send("{}")).status).toBe(500);
    expect((await Withdrawal.findById(withdrawal._id)).status).toBe("pending");
  });
});
