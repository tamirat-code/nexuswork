import { apiRequest } from "../../lib/http.js";

export const uploadFile = (file, { relatedType, relatedId, token } = {}) => {
  const form = new FormData();
  form.append("file", file);
  if (relatedType) form.append("related_type", relatedType);
  if (relatedId) form.append("related_id", relatedId);

  return apiRequest("/files/upload", {
    method: "POST",
    body: form,
    token,
  });
};

export const listContractFiles = (contractId, token) =>
  apiRequest(`/files/contract/${contractId}`, { token });

export const getFile = (id, token) => apiRequest(`/files/${id}`, { token });
export const deleteFile = (id, token) =>
  apiRequest(`/files/${id}`, { method: "DELETE", token });