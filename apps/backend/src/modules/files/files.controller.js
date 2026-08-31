import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { pipeline } from "node:stream/promises";
import fs from "fs";
import { ValidationError, NotFoundError } from "../../shared/exceptions/AppError.js";
import * as filesService from "./files.service.js";
import { validateUploadedFile } from "./files.upload.js";
import { assertFileAccess, assertFileUploadAccess } from "../../shared/authorization/resource-authorization.js";
import User from "../users/users.model.js";
import { scanUploadedFile } from "./file-scanner.js";

const VALID_RELATED_TYPES = new Set([
  "project_attachment",
  "submission",
  "portfolio",
  "message_attachment",
  "contract",
  "verification_document",
  "staff_verification_document",
  "skill_certification_evidence",
  "cv",
  "other",
]);

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file was uploaded (expected field name "file")');
  }

  const content = await validateUploadedFile(req.file);

  try {
    await scanUploadedFile({
      buffer: content.buffer,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    if (req.file.path) await fs.promises.unlink(req.file.path).catch(() => {});
    throw error;
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

  // Do not proxy large private objects through Render. The authorization
  // check above still happens here, but S3 serves the bytes directly through
  // a short-lived signed URL, avoiding proxy timeouts and premature closes.
  const privateUrl = await filesService.getPrivateContentUrl(file);
  if (privateUrl && ["1", "true"].includes(String(req.query.direct).toLowerCase())) {
    return res.redirect(302, privateUrl);
  }

  const object = await filesService.getPrivateContent(file);

  res.setHeader("Content-Type", file.mimetype);
  // Prefer the length reported by the storage provider. A stale database
  // length makes Render/Cloudflare wait for bytes that will never arrive and
  // can turn an otherwise successful download into HTTP 502.
  const contentLength = Number(object.ContentLength);
  if (Number.isSafeInteger(contentLength) && contentLength >= 0) {
    res.setHeader("Content-Length", String(contentLength));
  } else if (Number.isSafeInteger(file.size) && file.size >= 0) {
    res.setHeader("Content-Length", String(file.size));
  }
  const disposition = ["1", "true"].includes(String(req.query.download).toLowerCase()) ? "attachment" : "inline";
  res.setHeader("Content-Disposition", `${disposition}; filename="${String(file.original_name).replace(/[\"\r\n]/g, "_")}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    await pipeline(object.Body, res);
  } catch (error) {
    // The client/proxy can disconnect after the response starts. There is no
    // second response to send in that case, so let the connection close.
    if (error.code === "ERR_STREAM_PREMATURE_CLOSE" || res.headersSent || res.destroyed) return;
    throw error;
  }
});

export const remove = asyncHandler(async (req, res) => {
  await assertFileAccess({ fileId: req.params.id, req });
  const result = await filesService.deleteFile(req.params.id, req.user._id, {
    actor: req.user,
    correlationId: req.correlationId,
  });
  res.json({ success: true, data: result });
});
