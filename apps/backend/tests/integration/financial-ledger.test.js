import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db.js";
import FinancialJournal from "../../src/modules/financial-ledger/financial-journals.model.js";
import { postJournal, reverseJournal } from "../../src/modules/financial-ledger/financial-ledger.service.js";

beforeAll(async () => connectTestDB());
afterEach(async () => clearDB());
afterAll(async () => disconnectTestDB());

function fundingJournal(overrides = {}) {
  return {
    eventType: "test.funding",
    idempotencyKey: "test-funding-1",
    sourceType: "test",
    sourceId: "source-1",
    requestId: "request-1",
    entries: [
      { accountBase: "provider_clearing", debitMinor: 1000, creditMinor: 0, currency: "usd" },
      { accountBase: "escrow_liability", debitMinor: 0, creditMinor: 1000, currency: "usd" },
    ],
    ...overrides,
  };
}

describe("immutable financial ledger", () => {
  it("posts only balanced journals", async () => {
    const result = await postJournal(fundingJournal());
    expect(result.duplicate).toBe(false);
    expect(result.journal.entries).toHaveLength(2);

    await expect(postJournal(fundingJournal({
      idempotencyKey: "test-unbalanced",
      entries: [{ accountBase: "provider_clearing", debitMinor: 1000, creditMinor: 0, currency: "usd" }],
    }))).rejects.toThrow(/at least two entries/);
  });

  it("deduplicates repeated financial events", async () => {
    const first = await postJournal(fundingJournal());
    const second = await postJournal(fundingJournal());
    expect(second.duplicate).toBe(true);
    expect(String(second.journal._id)).toBe(String(first.journal._id));
    expect(await FinancialJournal.countDocuments()).toBe(1);
  });

  it("rejects mutation and represents correction as a reversal journal", async () => {
    const original = await postJournal(fundingJournal({ idempotencyKey: "test-reversal-original" }));
    await expect(FinancialJournal.updateOne({ _id: original.journal._id }, { $set: { event_type: "tampered" } })).rejects.toThrow(/append-only/);

    const reversal = await reverseJournal(original.journal.transaction_id, { requestId: "request-reversal" });
    expect(reversal.journal.reversed_transaction_id).toBe(original.journal.transaction_id);
    expect(reversal.journal.entries[0].debit_minor).toBe(original.journal.entries[0].credit_minor);
  });

  it("rejects mixed currencies and unbalanced amounts", async () => {
    await expect(postJournal(fundingJournal({
      idempotencyKey: "test-mixed-currency",
      entries: [
        { accountBase: "provider_clearing", debitMinor: 1000, creditMinor: 0, currency: "usd" },
        { accountBase: "escrow_liability", debitMinor: 0, creditMinor: 1000, currency: "etb" },
      ],
    }))).rejects.toThrow(/mix currencies/);

    await expect(postJournal(fundingJournal({
      idempotencyKey: "test-unbalanced-amount",
      entries: [
        { accountBase: "provider_clearing", debitMinor: 1000, creditMinor: 0, currency: "usd" },
        { accountBase: "escrow_liability", debitMinor: 0, creditMinor: 900, currency: "usd" },
      ],
    }))).rejects.toThrow(/equal/);
  });
});
