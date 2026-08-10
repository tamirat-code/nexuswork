import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";
import * as filesService from "./files.service.js";

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ValidationError("No file was uploaded (expected field name \"file\")");

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const file = await filesService.createFileRecord({
    ownerId: req.user._id,
    multerFile: req.file,
    baseUrl,
    related_type: req.body.related_type,
    related_id: req.body.related_id,
  });

  res.status(201).json({ success: true, data: file });
});

export const getOne = asyncHandler(async (req, res) => {
  const file = await filesService.getById(req.params.id);
  res.json({ success: true, data: file });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await filesService.deleteFile(req.params.id, req.user._id);
  res.json({ success: true, data: result });
});