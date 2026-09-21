import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import * as service from "./cohorts.service.js";

export const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.createCohort(req.user, req.body) }));
export const list = asyncHandler(async (req, res) => res.json({ success: true, data: await service.listCohorts(req.user, req.query) }));
export const getOne = asyncHandler(async (req, res) => res.json({ success: true, data: await service.getCohort(req.params.cohortId, req.user) }));
export const apply = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.applyToCohort(req.params.cohortId, req.user) }));
export const applications = asyncHandler(async (req, res) => res.json({ success: true, data: await service.listApplications(req.params.cohortId, req.user) }));
export const accept = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.acceptApplication(req.params.cohortId, req.params.applicationId, req.user) }));
export const progress = asyncHandler(async (req, res) => res.json({ success: true, data: await service.getCohortProgress(req.params.cohortId, req.user) }));
