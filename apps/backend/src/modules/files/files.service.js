import fs from "fs";
import path from "path";
import File from "./files.model.js";
import { storageConfig } from "../../config/storage.config.js";
import { NotFoundError, ForbiddenError } from "../../shared/exceptions/AppError.js";

export async function createFileRecord({ ownerId, multerFile, baseUrl, related_type, related_id }) {
  return File.create({
    owner_id: ownerId,
    filename: multerFile.filename,
    original_name: multerFile.originalname,
    mimetype: multerFile.mimetype,
    size: multerFile.size,
    url: `${baseUrl}/uploads/${multerFile.filename}`,
    related_type: related_type || "other",
    related_id: related_id || undefined,
  });
}

export async function getById(id) {
  const file = await File.findById(id);
  if (!file) throw new NotFoundError("File not found");
  return file;
}

export async function deleteFile(id, requestingUserId) {
  const file = await File.findById(id);
  if (!file) throw new NotFoundError("File not found");
  if (String(file.owner_id) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the uploader can delete this file");
  }

  const diskPath = path.join(storageConfig.absoluteUploadDir, file.filename);
  fs.unlink(diskPath, () => {}); // best-effort — don't fail the request if this errors

  await file.deleteOne();
  return { deleted: true };
}