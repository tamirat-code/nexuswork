import { apiRequest } from "../../lib/http.js";

export const listEvidence = (contractId, token) => apiRequest(`/evidence/contracts/${contractId}/artifacts`, { token });
export const createEvidence = (contractId, payload, token) => apiRequest(`/evidence/contracts/${contractId}/artifacts`, { method: "POST", body: payload, token });
export const listCheckpoints = (contractId, token) => apiRequest(`/evidence/contracts/${contractId}/checkpoints`, { token });
export const decideCheckpoint = (contractId, payload, token) => apiRequest(`/evidence/contracts/${contractId}/checkpoints`, { method: "POST", body: payload, token });
export const listRepositories = (contractId, token) => apiRequest(`/evidence/contracts/${contractId}/repositories`, { token });
export const startRepositoryOAuth = (contractId, provider, repository, token) => apiRequest(`/evidence/contracts/${contractId}/repositories/${provider}/start?repository=${encodeURIComponent(repository)}`, { token });
export const syncRepository = (connectionId, token) => apiRequest(`/evidence/repositories/${connectionId}/sync`, { method: "POST", token });
export const revokeRepository = (connectionId, token) => apiRequest(`/evidence/repositories/${connectionId}`, { method: "DELETE", token });
