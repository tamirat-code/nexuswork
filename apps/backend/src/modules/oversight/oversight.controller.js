import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import * as service from "./oversight.service.js";

export const getOversight = asyncHandler(async (req, res) => res.json({ success: true, data: await service.getOversight(req.params.projectId, req.user) }));
export const createTask = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.createTask(req.params.projectId, req.user, req.body) }));
export const updateTask = asyncHandler(async (req, res) => res.json({ success: true, data: await service.updateTask(req.params.taskId, req.user, req.body) }));
export const createCheckIn = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.createCheckIn(req.params.projectId, req.user, req.body) }));
export const listCheckIns = asyncHandler(async (req, res) => res.json({ success: true, data: await service.listCheckIns(req.params.projectId, req.user) }));
export const getContractsOverview = asyncHandler(async (req, res) => res.json({ success: true, data: await service.getClientContractsOverview(req.user) }));
