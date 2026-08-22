import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";
import * as filesService from "./files.service.js";

const VALID_RELATED_TYPES = new Set([
  "project_attachment",
  "submission",
  "portfolio",
  "message_attachment",
  "contract",
  "verification_document",
  "staff_verification_document",
  "other",
]);

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file was uploaded (expected field name "file")');
  }

  const relatedType = req.body.related_type || "other";
  const relatedId = req.body.related_id;

  if (!VALID_RELATED_TYPES.has(relatedType)) {
    throw new ValidationError("Invalid related_type");
  }

  if (["contract", "submission"].includes(relatedType)) {
    if (!relatedId) throw new ValidationError(`related_id is required for ${relatedType} files`);
    // Submission files are normally attached atomically after upload by the submission service.
    // Direct submission attachment is still authorized by the file service.
    if (relatedType === "contract") {
      await filesService.listForContract(relatedId, req.user._id);
    } else {
      await filesService.assertSubmissionParty(relatedId, req.user._id);
    }
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const file = await filesService.createFileRecord({
    ownerId: req.user._id,
    multerFile: req.file,
    baseUrl,
    related_type: relatedType,
    related_id: relatedId,
  });

  res.status(201).json({ success: true, data: file });
});

export const getForContract = asyncHandler(async (req, res) => {
  const files = await filesService.listForContract(req.params.contractId, req.user._id);
  res.json({ success: true, data: files });
});

export const getOne = asyncHandler(async (req, res) => {
  const file = await filesService.getById(req.params.id, req.user);
  res.json({ success: true, data: file });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await filesService.deleteFile(req.params.id, req.user._id);
  res.json({ success: true, data: result });
});