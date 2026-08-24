import { apiRequest } from "../../lib/http.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/v1";

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

export const fetchFileBlob = async (id, token) => {
  const res = await fetch(`${API_BASE_URL}/files/content/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Unable to open file (${res.status})`);
  }
  return res.blob();
};