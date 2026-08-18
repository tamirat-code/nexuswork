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

export async function getById(id, requestingUser) {
  const file = await File.findById(id);
  if (!file) throw new NotFoundError("File not found");

  
  if (file.related_type === "verification_document") {
    await assertCanViewVerificationDocument(file, requestingUser);
  }

  return file;
}

async function assertCanViewVerificationDocument(file, requestingUser) {
  if (!requestingUser) throw new ForbiddenError("You don't have access to this document");
  if (String(file.owner_id) === String(requestingUser._id)) return;
  if (requestingUser.role === "admin") return;

  if (requestingUser.role === "university_staff") {
    const [{ default: Verification }, { default: University }] = await Promise.all([
      import("../verifications/verifications.model.js"),
      import("../universities/universities.model.js"),
    ]);
    const verification = await Verification.findOne({ document_file_id: file._id });
    if (verification) {
      const university = await University.findById(verification.university_id);
      const isContactStaff = university?.contact_staff?.some(
        (staffId) => String(staffId) === String(requestingUser._id)
      );
      if (isContactStaff) return;
    }
  }

  throw new ForbiddenError("You don't have access to this document");
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