import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { sendMessage, listMessages } from "./messaging.service.js";
import { assertContractParty } from "../../shared/authorization/resource-authorization.js";

export const create = asyncHandler(async (req, res) => {
  await assertContractParty({ contractId: req.params.contractId, req });
  const body = String(req.body?.body || "").trim();
  const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];

  if (!body && attachments.length === 0) {
    const err = new Error("Message text or at least one attachment is required");
    err.status = 400;
    throw err;
  }

  const message = await sendMessage(
    req.params.contractId,
    req.user._id,
    { body, attachments },
    { actor: req.user, correlationId: req.correlationId }
  );

  res.status(201).json({ success: true, data: message });
});

export const getForContract = asyncHandler(async (req, res) => {
  await assertContractParty({ contractId: req.params.contractId, req });
  const { limit = 50, skip = 0 } = req.pagination || {};
  const messages = await listMessages(
    req.params.contractId,
    req.user._id,
    { limit, skip }
  );

  res.json({ success: true, data: messages });
});
