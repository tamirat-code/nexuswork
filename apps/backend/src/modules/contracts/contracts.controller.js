import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { NotFoundError, ForbiddenError } from "../../shared/exceptions/AppError.js";
import {
  getContract,
  listForUser,
  reviewContract,
  signContract,
} from "./contracts.service.js";

function getId(value) {
  return String(value?._id || value);
}

function assertContractParty(contract, user) {
  if (user.role === "admin") {
    return;
  }

  const userId = String(user._id);
  const clientId = getId(contract.client_id);
  const studentId = getId(contract.student_id);

  if (clientId !== userId && studentId !== userId) {
    throw new ForbiddenError("Not a party to this contract");
  }
}

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

  assertContractParty(contract, req.user);

  res.json({
    success: true,
    data: contract,
  });
});

export const review = asyncHandler(async (req, res) => {
  const contract = await reviewContract(
    req.params.id,
    req.user._id
  );

  res.json({
    success: true,
    data: contract,
  });
});

export const sign = asyncHandler(async (req, res) => {
  const contract = await signContract(
    req.params.id,
    req.user._id,
    {
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
    }
  );

  res.json({
    success: true,
    data: contract,
  });
});