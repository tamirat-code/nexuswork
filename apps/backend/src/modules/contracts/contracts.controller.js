import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { NotFoundError, ForbiddenError } from "../../shared/exceptions/AppError.js";
import { getContract, listForUser, signContract } from "./contracts.service.js";

export const getMyContracts = asyncHandler(async (req, res) => {
  const contracts = await listForUser(req.user._id);
  res.json({ success: true, data: contracts });
});

export const getOne = asyncHandler(async (req, res) => {
  const contract = await getContract(req.params.id);
  if (!contract) throw new NotFoundError("Contract not found");

  const userId = String(req.user._id);
  if (req.user.role !== "admin" && String(contract.client_id) !== userId && String(contract.student_id) !== userId) {
    throw new ForbiddenError("Not a party to this contract");
  }

  res.json({ success: true, data: contract });
});

export const sign = asyncHandler(async (req, res) => {
  const contract = await signContract(req.params.id, req.user._id);
  res.json({ success: true, data: contract });
});
