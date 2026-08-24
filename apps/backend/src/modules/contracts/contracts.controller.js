import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { NotFoundError } from "../../shared/exceptions/AppError.js";
import { assertContractParty } from "../../shared/authorization/resource-authorization.js";
import {
  getContract,
  listForUser,
  reviewContract,
  signContract,
} from "./contracts.service.js";

export const getMyContracts = asyncHandler(async (req, res) => {
  const contracts = await listForUser(req.user._id);

  res.json({
    success: true,
    data: contracts,
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const contract = await getContract(req.params.id);

  if (!contract) {
    throw new NotFoundError("Contract not found");
  }

  await assertContractParty({ contractId: req.params.id, req, allowAdmin: true });

  res.json({
    success: true,
    data: contract,
  });
});

export const review = asyncHandler(async (req, res) => {
  await assertContractParty({ contractId: req.params.id, req });
  const contract = await reviewContract(
    req.params.id,
    req.user._id,
    { actor: req.user, correlationId: req.correlationId }
  );

  res.json({
    success: true,
    data: contract,
  });
});

export const sign = asyncHandler(async (req, res) => {
  await assertContractParty({ contractId: req.params.id, req });
  const contract = await signContract(
    req.params.id,
    req.user._id,
    {
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
      actor: req.user,
      correlationId: req.correlationId,
    }
  );

  res.json({
    success: true,
    data: contract,
  });
});
