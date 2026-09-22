import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireEmailVerified } from "../../middleware/verification.middleware.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { objectIdParamsSchema } from "../../shared/validators/schemas.js";
import { listArtifacts, createArtifact, listCheckpoints, createCheckpoint, listRepositories, startRepositoryOAuth, repositoryCallback, revokeRepository, syncRepository } from "./evidence.controller.js";
import { z } from "zod";

const artifactSchema = z.object({ kind: z.enum(["upload", "link", "text", "check_in"]), title: z.string().trim().min(2).max(240), body: z.string().max(10000).optional(), url: z.string().url().optional(), file_id: z.string().regex(/^[a-f0-9]{24}$/i).optional(), milestone_id: z.string().regex(/^[a-f0-9]{24}$/i).optional(), occurred_at: z.coerce.date().optional() });
const checkpointSchema = z.object({ milestone_id: z.string().regex(/^[a-f0-9]{24}$/i).optional(), status: z.enum(["pending", "approved", "revision_requested"]), note: z.string().max(4000).optional() });
const connectionParams = z.object({ connectionId: z.string().regex(/^[a-f0-9]{24}$/i) });

const router = Router();
router.get("/oauth/:provider/callback", repositoryCallback);
router.use(requireAuth);
router.get("/contracts/:contractId/artifacts", validateParams(objectIdParamsSchema("contractId")), listArtifacts);
router.post("/contracts/:contractId/artifacts", requireEmailVerified, validateParams(objectIdParamsSchema("contractId")), validateBody(artifactSchema), createArtifact);
router.get("/contracts/:contractId/checkpoints", validateParams(objectIdParamsSchema("contractId")), listCheckpoints);
router.post("/contracts/:contractId/checkpoints", requireEmailVerified, validateParams(objectIdParamsSchema("contractId")), validateBody(checkpointSchema), createCheckpoint);
router.get("/contracts/:contractId/repositories", validateParams(objectIdParamsSchema("contractId")), listRepositories);
router.get("/contracts/:contractId/repositories/:provider/start", requireEmailVerified, validateParams(objectIdParamsSchema("contractId")), startRepositoryOAuth);
router.post("/repositories/:connectionId/sync", requireEmailVerified, validateParams(connectionParams), syncRepository);
router.delete("/repositories/:connectionId", requireEmailVerified, validateParams(connectionParams), revokeRepository);
export default router;
