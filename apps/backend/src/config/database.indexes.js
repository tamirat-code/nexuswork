import Withdrawal from "../modules/wallets/withdrawal.model.js";
import Payment from "../modules/payments/payments.model.js";
import StudentProfile from "../modules/students/students.model.js";

export const LEGACY_WITHDRAWAL_IDEMPOTENCY_INDEX = "idempotency_key_1";
export const WITHDRAWAL_IDEMPOTENCY_INDEX = "withdrawals_user_id_idempotency_key_unique";
export const PAYMENT_PROVIDER_PAYMENT_INDEX = "provider_1_provider_payment_id_1";
export const PAYMENT_PROVIDER_EVENT_INDEX = "provider_1_provider_event_id_1";
export const STUDENT_IDENTITY_INDEX = "student_profiles_university_student_id_unique";

function legacyIdempotencyKey(withdrawalId) {
  return `legacy-withdrawal-${withdrawalId}`;
}

function hasKey(index, key) {
  return JSON.stringify(index.key) === JSON.stringify(key);
}

function isLegacyWithdrawalIdempotencyIndex(index) {
  return index.name === LEGACY_WITHDRAWAL_IDEMPOTENCY_INDEX || (
    index.unique === true &&
    hasKey(index, { idempotency_key: 1 })
  );
}

function isWithdrawalIdempotencyIndex(index) {
  return index.name === WITHDRAWAL_IDEMPOTENCY_INDEX || (
    index.unique === true &&
    hasKey(index, { user_id: 1, idempotency_key: 1 })
  );
}

function hasPaymentKey(index, field) {
  return index?.key?.provider === 1 && index?.key?.[field] === 1;
}

async function ensurePartialUniquePaymentIndex(field, name) {
  const indexes = await Payment.collection.listIndexes().toArray().catch(async (error) => {
    if (error.codeName !== "NamespaceNotFound") throw error;
    await Payment.createIndexes();
    return Payment.collection.listIndexes().toArray();
  });
  const matches = indexes.filter((index) => hasPaymentKey(index, field));
  const desired = matches.find((index) => index.name === name && index.unique && index.partialFilterExpression?.[field]?.$type === "string");
  if (desired) return { name, changed: false };

  for (const index of matches) await Payment.collection.dropIndex(index.name);
  await Payment.collection.createIndex(
    { provider: 1, [field]: 1 },
    { unique: true, name, partialFilterExpression: { [field]: { $type: "string" } } }
  );
  return { name, changed: true };
}

export async function ensurePaymentIndexes() {
  const paymentId = await ensurePartialUniquePaymentIndex("provider_payment_id", PAYMENT_PROVIDER_PAYMENT_INDEX);
  const eventId = await ensurePartialUniquePaymentIndex("provider_event_id", PAYMENT_PROVIDER_EVENT_INDEX);
  return { changed: paymentId.changed || eventId.changed, indexes: [paymentId.name, eventId.name] };
}

export async function ensureStudentProfileIndexes() {
  const duplicate = await StudentProfile.aggregate([
    { $match: { student_id_number: { $type: "string", $gt: "" } } },
    { $group: { _id: { university_id: "$university_id", student_id_number: "$student_id_number" }, ids: { $push: "$_id" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]);
  if (duplicate.length) {
    throw new Error(
      "Cannot create student identity index: duplicate student_id_number values exist within a university"
    );
  }

  const indexes = await StudentProfile.collection.listIndexes().toArray().catch(async (error) => {
    if (error.codeName !== "NamespaceNotFound") throw error;
    await StudentProfile.createIndexes();
    return StudentProfile.collection.listIndexes().toArray();
  });
  const existing = indexes.find((index) => index.name === STUDENT_IDENTITY_INDEX && index.unique);
  if (existing) return { changed: false, name: STUDENT_IDENTITY_INDEX };

  const conflicting = indexes.find((index) =>
    index.unique && JSON.stringify(index.key) === JSON.stringify({ university_id: 1, student_id_number: 1 })
  );
  if (conflicting) await StudentProfile.collection.dropIndex(conflicting.name);

  await StudentProfile.collection.createIndex(
    { university_id: 1, student_id_number: 1 },
    {
      unique: true,
      name: STUDENT_IDENTITY_INDEX,
      partialFilterExpression: { student_id_number: { $type: "string", $gt: "" } },
    }
  );
  return { changed: true, name: STUDENT_IDENTITY_INDEX };
}


export async function ensureWithdrawalIndexes() {
  let indexes;
  try {
    indexes = await Withdrawal.collection.listIndexes().toArray();
  } catch (error) {
    if (error.codeName !== "NamespaceNotFound") throw error;
    // This creates the collection/indexes for a fresh database.
    await Withdrawal.createIndexes();
    indexes = await Withdrawal.collection.listIndexes().toArray();
  }

  const legacyWithdrawals = await Withdrawal.collection.find({
    $or: [
      { idempotency_key: { $exists: false } },
      { idempotency_key: null },
      { idempotency_key: "" },
    ],
  }).project({ _id: 1, idempotency_key: 1 }).toArray();

  const preExistingDuplicateKeys = await Withdrawal.aggregate([
    { $match: { idempotency_key: { $exists: true, $nin: [null, ""] } } },
    { $group: { _id: { user_id: "$user_id", idempotency_key: "$idempotency_key" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]);
  if (preExistingDuplicateKeys.length) {
    throw new Error(
      "Cannot upgrade withdrawal idempotency indexes: duplicate user_id/idempotency_key records exist"
    );
  }

  let backfilled = 0;
  for (const withdrawal of legacyWithdrawals) {
    const idempotencyKey = legacyIdempotencyKey(withdrawal._id.toString());
    const conflictingWithdrawal = await Withdrawal.collection.findOne({
      _id: { $ne: withdrawal._id },
      idempotency_key: idempotencyKey,
    }, { projection: { _id: 1 } });
    if (conflictingWithdrawal) {
      throw new Error(
        `Cannot backfill withdrawal ${withdrawal._id}: generated idempotency key already exists`
      );
    }
    const result = await Withdrawal.collection.updateOne(
      {
        _id: withdrawal._id,
        $or: [
          { idempotency_key: { $exists: false } },
          { idempotency_key: null },
          { idempotency_key: "" },
        ],
      },
      { $set: { idempotency_key: idempotencyKey } }
    );
    backfilled += result.modifiedCount;
  }

  const duplicateKeys = await Withdrawal.aggregate([
    { $group: { _id: { user_id: "$user_id", idempotency_key: "$idempotency_key" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]);
  if (duplicateKeys.length) {
    throw new Error(
      "Cannot upgrade withdrawal idempotency indexes: duplicate user_id/idempotency_key records exist"
    );
  }

  const removed = [];
  for (const index of indexes.filter((candidate) =>
    isLegacyWithdrawalIdempotencyIndex(candidate) ||
    (isWithdrawalIdempotencyIndex(candidate) && candidate.name !== WITHDRAWAL_IDEMPOTENCY_INDEX)
  )) {
    await Withdrawal.collection.dropIndex(index.name);
    removed.push({ name: index.name, key: index.key, unique: index.unique });
  }

  await Withdrawal.collection.createIndex(
    { user_id: 1, idempotency_key: 1 },
    { unique: true, name: WITHDRAWAL_IDEMPOTENCY_INDEX }
  );
  indexes = await Withdrawal.collection.listIndexes().toArray();

  return {
    backfilled,
    removed,
    created: indexes.some(isWithdrawalIdempotencyIndex),
    indexes: indexes.map(({ name, key, unique, sparse }) => ({ name, key, unique, sparse })),
  };
}
