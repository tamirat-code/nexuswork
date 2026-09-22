import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import * as service from "./evidence.service.js";

export const listArtifacts = asyncHandler(async (req, res) => res.json({ success: true, data: await service.listArtifacts(req.params.contractId, req.user) }));
export const createArtifact = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.createArtifact(req.params.contractId, req.user, req.body) }));
export const listCheckpoints = asyncHandler(async (req, res) => res.json({ success: true, data: await service.listCheckpoints(req.params.contractId, req.user) }));
export const createCheckpoint = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.createCheckpoint(req.params.contractId, req.user, req.body) }));
export const listRepositories = asyncHandler(async (req, res) => res.json({ success: true, data: await service.listRepositories(req.params.contractId, req.user) }));
export const startRepositoryOAuth = asyncHandler(async (req, res) => res.json({ success: true, data: { authorization_url: await service.startRepositoryOAuth(req.params.contractId, req.user, req.params.provider, req.query.repository) } }));
export const repositoryCallback = asyncHandler(async (req, res) => { const connection = await service.finishRepositoryOAuth({ code: req.query.code, state: req.query.state }); res.redirect(302, `${process.env.CLIENT_URL || "http://localhost:5173"}/contracts/${connection.contract_id}?evidence=connected`); });
export const revokeRepository = asyncHandler(async (req, res) => res.json({ success: true, data: await service.revokeRepository(req.params.connectionId, req.user) }));
export const syncRepository = asyncHandler(async (req, res) => res.json({ success: true, data: await service.syncRepository(req.params.connectionId, req.user) }));
