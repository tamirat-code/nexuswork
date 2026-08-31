import { apiRequest, csrfHeaders } from "../../lib/http.js";
import { logger } from "../../lib/logger.js";

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
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...csrfHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.message || `Unable to open file (${res.status})`);
    error.status = res.status;
    Object.assign(error, data);
    logger.error("File request failed", error, { operation: "preview", fileId: id, status: res.status });
    throw error;
  }
  return res.blob();
};

export const downloadFile = async (id, token, filename = "download") => {
  const res = await fetch(`${API_BASE_URL}/files/content/${id}?download=1`, {
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...csrfHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.message || `Unable to download file (${res.status})`);
    error.status = res.status;
    Object.assign(error, data);
    logger.error("File request failed", error, { operation: "download", fileId: id, status: res.status });
    throw error;
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/i);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = match?.[1] || filename || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
};
