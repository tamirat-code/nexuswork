import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ValidationError, NotFoundError } from "../../shared/exceptions/AppError.js";
import * as filesService from "./files.service.js";
import { validateUploadedFile } from "./files.upload.js";
import { assertFileAccess, assertFileUploadAccess } from "../../shared/authorization/resource-authorization.js";
import User from "../users/users.model.js";

const VALID_RELATED_TYPES = new Set([
  "project_attachment",
  "submission",
  "portfolio",
  "message_attachment",
  "contract",
  "verification_document",
  "staff_verification_document",
  "cv",
  "other",
]);

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file was uploaded (expected field name "file")');
  }

  const content = await validateUploadedFile(req.file);

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

  await assertFileUploadAccess({ relatedType, relatedId, req });

  const file = await filesService.createFileRecord({
    ownerId: req.user._id,
    multerFile: req.file,
    contentHash: content.sha256,
    related_type: relatedType,
    related_id: relatedId,
    auditContext: { actor: req.user, correlationId: req.correlationId },
  });

  if (relatedType === "cv") {
    await User.findByIdAndUpdate(req.user._id, { cv_file_id: file._id });
  }

  res.status(201).json({ success: true, data: file });
});

export const getForContract = asyncHandler(async (req, res) => {
  await assertFileUploadAccess({ relatedType: "contract", relatedId: req.params.contractId, req });
  const files = await filesService.listForContract(req.params.contractId, req.user._id);
  res.json({ success: true, data: files });
});

export const getOne = asyncHandler(async (req, res) => {
  await assertFileAccess({ fileId: req.params.id, req });
  const file = await filesService.getById(req.params.id, req.user);
  res.json({ success: true, data: file });
});

export const content = asyncHandler(async (req, res) => {
  await assertFileAccess({ fileId: req.params.id, req });
  const file = await filesService.getById(req.params.id, req.user);
  const object = await filesService.getPrivateContent(file);

  res.setHeader("Content-Type", file.mimetype);
  res.setHeader("Content-Length", String(file.size));
  res.setHeader("Content-Disposition", `inline; filename="${String(file.original_name).replace(/[\"\r\n]/g, "_")}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  object.Body.pipe(res);
});

export const remove = asyncHandler(async (req, res) => {
  await assertFileAccess({ fileId: req.params.id, req });
  const result = await filesService.deleteFile(req.params.id, req.user._id, {
    actor: req.user,
    correlationId: req.correlationId,
  });
  res.json({ success: true, data: result });
});
