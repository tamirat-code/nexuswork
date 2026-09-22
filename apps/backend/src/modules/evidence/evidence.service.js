import crypto from "node:crypto";
import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import File from "../files/files.model.js";
import TaskArtifact from "./task-artifact.model.js";
import RepositoryConnection from "./repository-connection.model.js";
import EvidenceCheckpoint from "./evidence-checkpoint.model.js";
import EvidenceOauthState from "./evidence-oauth-state.model.js";
import CheckIn from "../oversight/check-ins.model.js";
import { isOrgMember } from "../clients/clients.service.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { env } from "../../config/env.js";
import { encryptRepositoryToken, decryptRepositoryToken } from "./repository-token.js";
import { ForbiddenError, NotFoundError, ValidationError, ConflictError } from "../../shared/exceptions/AppError.js";

function id(value) { return String(value?._id || value); }

async function getContractAccess(contractId, userId) {
  const contract = await Contract.findById(contractId).lean();
  if (!contract) throw new NotFoundError("Contract not found");
  const student = id(contract.student_id) === id(userId);
  const client = id(contract.client_id) === id(userId);
  const organizationMember = !student && !client && await isOrgMember(contract.client_id, userId);
  if (!student && !client && !organizationMember) throw new ForbiddenError("You do not have access to this contract evidence");
  return { contract, student, client: client || organizationMember };
}

async function audit(actor, eventType, action, contractId, metadata = {}) {
  return recordEvent({ actor, eventType, action, entityType: "contract", entityId: contractId, organizationId: metadata.organization_id, correlationId: crypto.randomUUID(), metadata: { contract_id: contractId, ...metadata } });
}

function assertHttpUrl(value) {
  try { const parsed = new URL(value); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); return parsed.toString(); } catch { throw new ValidationError("Evidence links must be valid HTTP or HTTPS URLs"); }
}

export async function listArtifacts(contractId, user) {
  await getContractAccess(contractId, user._id);
  const [artifacts, checkIns] = await Promise.all([
    TaskArtifact.find({ contract_id: contractId }).populate("author_id", "name role").populate("file_id", "original_name mimetype size url").sort({ occurred_at: -1, createdAt: -1 }).lean(),
    CheckIn.find({ project_id: (await Contract.findById(contractId).select("project_id").lean())?.project_id }).populate("author_id", "name role").sort({ createdAt: -1 }).lean(),
  ]);
  const checkInArtifacts = checkIns.map((checkIn) => ({ ...checkIn, _id: `check-in-${checkIn._id}`, kind: "check_in", title: "Student check-in", body: [checkIn.summary, checkIn.blockers ? `Blockers: ${checkIn.blockers}` : ""].filter(Boolean).join("\n\n") || `${checkIn.progress}% progress update`, occurred_at: checkIn.createdAt, author_id: checkIn.author_id, metadata: { progress: checkIn.progress, fallback: true } }));
  // Check-ins remain visible as a neutral recency signal when no repository
  // evidence exists; neither check-ins nor missing evidence produce a score.
  return [...artifacts, ...checkInArtifacts].sort((a, b) => new Date(b.occurred_at || b.createdAt) - new Date(a.occurred_at || a.createdAt));
}

export async function createArtifact(contractId, user, input) {
  const access = await getContractAccess(contractId, user._id);
  if (!access.student) throw new ForbiddenError("Only the contracted student can add progress evidence");
  const kind = input.kind;
  if (kind === "link" && !input.url) throw new ValidationError("A link is required");
  if (["text", "check_in"].includes(kind) && !String(input.body || "").trim()) throw new ValidationError("A text update is required");
  if (kind === "upload" && !input.file_id) throw new ValidationError("A file is required");
  if (kind === "commit") throw new ValidationError("Repository commits are added by repository sync");
  let file = null;
  if (input.file_id) {
    file = await File.findOne({ _id: input.file_id, owner_id: user._id });
    if (!file) throw new ForbiddenError("You can only attach files that you own");
  }
  if (input.milestone_id) {
    const milestone = await Milestone.findOne({ _id: input.milestone_id, contract_id: contractId }).select("_id").lean();
    if (!milestone) throw new ValidationError("Milestone does not belong to this contract");
  }
  const artifact = await TaskArtifact.create({ contract_id: contractId, milestone_id: input.milestone_id || null, author_id: user._id, kind, title: input.title, body: String(input.body || "").trim(), url: input.url ? assertHttpUrl(input.url) : null, file_id: file?._id || null, occurred_at: input.occurred_at || new Date() });
  await audit(user, "EVIDENCE_ARTIFACT_CREATED", "evidence.artifact_created", contractId, { artifact_id: artifact._id, kind });
  return artifact;
}

export async function listCheckpoints(contractId, user) {
  await getContractAccess(contractId, user._id);
  return EvidenceCheckpoint.find({ contract_id: contractId }).populate("reviewer_id", "name role").sort({ createdAt: -1 }).lean();
}

export async function createCheckpoint(contractId, user, input) {
  const access = await getContractAccess(contractId, user._id);
  if (!access.client) throw new ForbiddenError("Only the client team can review checkpoints");
  if (input.milestone_id) {
    const exists = await Milestone.exists({ _id: input.milestone_id, contract_id: contractId });
    if (!exists) throw new ValidationError("Milestone does not belong to this contract");
  }
  const checkpoint = await EvidenceCheckpoint.create({ contract_id: contractId, milestone_id: input.milestone_id || null, reviewer_id: user._id, status: input.status, note: String(input.note || "").trim() });
  await audit(user, "EVIDENCE_CHECKPOINT_DECIDED", "evidence.checkpoint_decided", contractId, { checkpoint_id: checkpoint._id, status: checkpoint.status, milestone_id: checkpoint.milestone_id });
  return checkpoint;
}

function providerConfig(provider) {
  if (provider === "github") return { clientId: env.githubClientId, clientSecret: env.githubClientSecret, callback: env.githubEvidenceCallbackUrl || `${env.credentialIssuerUrl}/v1/evidence/oauth/github/callback`, authorize: "https://github.com/login/oauth/authorize", token: "https://github.com/login/oauth/access_token" };
  if (provider === "gitlab") return { clientId: env.gitlabClientId, clientSecret: env.gitlabClientSecret, callback: env.gitlabEvidenceCallbackUrl || `${env.credentialIssuerUrl}/v1/evidence/oauth/gitlab/callback`, authorize: "https://gitlab.com/oauth/authorize", token: "https://gitlab.com/oauth/token" };
  throw new ValidationError("Unsupported repository provider");
}

export async function startRepositoryOAuth(contractId, user, provider, repository) {
  const access = await getContractAccess(contractId, user._id);
  if (!access.student) throw new ForbiddenError("Only the contracted student can connect a repository");
  const normalizedRepository = String(repository || "").trim().replace(/^https?:\/\/(github\.com|gitlab\.com)\//, "").replace(/\.git$/, "");
  if (!/^[^/\s]+\/[^/\s]+$/.test(normalizedRepository)) throw new ValidationError("Choose one approved repository in owner/name format");
  const config = providerConfig(provider);
  if (!config.clientId || !config.clientSecret) throw new ValidationError(`${provider} OAuth is not configured on this deployment`);
  const state = crypto.randomBytes(32).toString("base64url");
  await EvidenceOauthState.create({ state, contract_id: contractId, student_id: user._id, provider, repository: normalizedRepository, expires_at: new Date(Date.now() + 10 * 60 * 1000) });
  const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.callback, state });
  if (provider === "github") params.set("scope", "read:user repo");
  else params.set("scope", "read_api read_repository");
  return `${config.authorize}?${params}`;
}

async function exchangeCode(provider, code) {
  const config = providerConfig(provider);
  const response = await fetch(config.token, { method: "POST", headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, grant_type: "authorization_code", redirect_uri: config.callback }) });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new ValidationError("Repository provider authorization failed");
  return data.access_token;
}

async function providerRepository(provider, repository, token) {
  const encoded = encodeURIComponent(repository);
  const url = provider === "github" ? `https://api.github.com/repos/${repository}` : `https://gitlab.com/api/v4/projects/${encoded}`;
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}`, accept: "application/json", "user-agent": "NexusWork" } });
  const data = await response.json();
  if (!response.ok) throw new ForbiddenError("The approved repository could not be verified with the provider");
  const allowed = provider === "github" ? Boolean(data.permissions?.push || data.permissions?.admin) : Number(data.permissions?.project_access?.access_level || data.permissions?.access_level || 0) >= 30;
  if (!allowed) throw new ForbiddenError("You do not have sufficient access to this repository");
  return { id: String(data.id), fullName: provider === "github" ? data.full_name : data.path_with_namespace, defaultBranch: data.default_branch || "main", providerUserId: provider === "github" ? String(data.owner?.id || "unknown") : String(data.namespace?.id || "unknown") };
}

export async function finishRepositoryOAuth({ code, state }) {
  const transaction = await EvidenceOauthState.findOne({ state, expires_at: { $gt: new Date() }, consumed_at: null });
  if (!transaction) throw new ValidationError("Repository authorization expired or was already used");
  transaction.consumed_at = new Date(); await transaction.save();
  const token = await exchangeCode(transaction.provider, code);
  const repository = await providerRepository(transaction.provider, transaction.repository, token);
  const connection = await RepositoryConnection.findOneAndUpdate({ contract_id: transaction.contract_id, student_id: transaction.student_id, provider: transaction.provider, repository: repository.fullName }, { contract_id: transaction.contract_id, student_id: transaction.student_id, provider: transaction.provider, provider_user_id: repository.providerUserId, provider_repository_id: repository.id, repository: repository.fullName, default_branch: repository.defaultBranch, scopes: transaction.provider === "github" ? ["read:user", "repo"] : ["read_api", "read_repository"], token_encrypted: encryptRepositoryToken(token), status: "active", last_sync_error: "" }, { upsert: true, new: true, setDefaultsOnInsert: true });
  await audit({ _id: transaction.student_id, role: "student" }, "REPOSITORY_CONNECTED", "evidence.repository_connected", transaction.contract_id, { repository_connection_id: connection._id, provider: connection.provider, repository: connection.repository });
  return connection;
}

export async function listRepositories(contractId, user) {
  const access = await getContractAccess(contractId, user._id);
  return RepositoryConnection.find({ contract_id: contractId, ...(access.student ? { student_id: user._id } : {}) }).select("provider repository default_branch scopes status last_sync_at last_sync_error createdAt").lean();
}

export async function revokeRepository(connectionId, user) {
  const connection = await RepositoryConnection.findById(connectionId);
  if (!connection) throw new NotFoundError("Repository connection not found");
  const access = await getContractAccess(connection.contract_id, user._id);
  if (!access.student) throw new ForbiddenError("Only the connected student can revoke this repository");
  connection.status = "revoked"; connection.token_encrypted = "revoked"; connection.last_sync_error = "Connection revoked by student"; await connection.save();
  await audit(user, "REPOSITORY_REVOKED", "evidence.repository_revoked", connection.contract_id, { repository_connection_id: connection._id, repository: connection.repository });
  return connection;
}

async function providerCommits(connection, token) {
  if (connection.provider === "github") {
    const response = await fetch(`https://api.github.com/repos/${connection.repository}/commits?per_page=50`, { headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "NexusWork" } });
    if (!response.ok) throw new ValidationError("GitHub commit sync failed");
    return (await response.json()).map((item) => ({ id: item.sha, title: item.commit?.message?.split("\n")[0] || "Commit", body: item.commit?.message || "", url: item.html_url, occurred_at: item.commit?.author?.date || item.commit?.committer?.date, metadata: { sha: item.sha, author: item.commit?.author?.name || "" } }));
  }
  const response = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(connection.repository)}/repository/commits?per_page=50`, { headers: { authorization: `Bearer ${token}`, accept: "application/json" } });
  if (!response.ok) throw new ValidationError("GitLab commit sync failed");
  return (await response.json()).map((item) => ({ id: item.id, title: item.title || "Commit", body: item.message || "", url: item.web_url, occurred_at: item.committed_date || item.created_at, metadata: { sha: item.id, author: item.author_name || "" } }));
}

export async function syncRepository(connectionId, user) {
  const connection = await RepositoryConnection.findById(connectionId).select("+token_encrypted");
  if (!connection) throw new NotFoundError("Repository connection not found");
  const access = await getContractAccess(connection.contract_id, user._id);
  if (!access.student) throw new ForbiddenError("Only the connected student can sync this repository");
  if (connection.status !== "active") throw new ConflictError("Repository connection is revoked");
  try {
    const commits = await providerCommits(connection, decryptRepositoryToken(connection.token_encrypted));
    const artifacts = [];
    for (const commit of commits) {
      const artifact = await TaskArtifact.findOneAndUpdate({ repository_connection_id: connection._id, external_id: commit.id }, { contract_id: connection.contract_id, author_id: connection.student_id, kind: "commit", title: commit.title, body: commit.body, url: commit.url, provider: connection.provider, repository_connection_id: connection._id, external_id: commit.id, occurred_at: commit.occurred_at, metadata: commit.metadata }, { upsert: true, new: true, setDefaultsOnInsert: true });
      artifacts.push(artifact);
    }
    connection.last_sync_at = new Date(); connection.last_sync_error = ""; await connection.save();
    await audit(user, "REPOSITORY_SYNCED", "evidence.repository_synced", connection.contract_id, { repository_connection_id: connection._id, commit_count: artifacts.length });
    return { connection, imported: artifacts.length };
  } catch (error) {
    connection.last_sync_error = error.message; await connection.save(); throw error;
  }
}

export async function syncActiveRepositories({ limit = 100 } = {}) {
  const connections = await RepositoryConnection.find({ status: "active" }).select("_id student_id").limit(Math.min(500, Math.max(1, Number(limit) || 100))).lean();
  const results = await Promise.allSettled(connections.map((connection) => syncRepository(connection._id, { _id: connection.student_id, role: "student" })));
  return { checked: results.length, succeeded: results.filter((result) => result.status === "fulfilled").length, failed: results.filter((result) => result.status === "rejected").length };
}
