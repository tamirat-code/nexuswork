import { apiRequest, authenticatedFetch } from "../../lib/http.js";
import { logger } from "../../lib/logger.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/v1";

export const getFileContentUrl = (id, { direct = false } = {}) =>
  `${API_BASE_URL}/files/content/${encodeURIComponent(id)}${direct ? "?direct=1" : ""}`;

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
  const res = await authenticatedFetch(getFileContentUrl(id), {
    token,
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

// Open the tab synchronously from the user's click before awaiting the
// authenticated request so browser popup blockers do not reject the preview.
export const openFilePreview = async (id, token) => {
  // Do not pass `noopener,noreferrer` to window.open here. Some browsers
  // return null for that feature combination even when the tab was opened,
  // which incorrectly looks like a popup-blocker failure to the caller.
  const previewWindow = window.open("about:blank", "_blank");
  if (!previewWindow) throw new Error("Please allow pop-ups to open this file");
  previewWindow.opener = null;
  try {
    // Keep the Authorization header/cookie on the API request while asking
    // the backend to redirect to object storage instead of proxying the file
    // bytes through Render.
    const response = await authenticatedFetch(`${getFileContentUrl(id, { direct: true })}&json=1`, { token });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.message || `Unable to open file (${response.status})`);
      error.status = response.status;
      Object.assign(error, data);
      throw error;
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (!data?.data?.url) throw new Error("File preview URL was not returned");
      previewWindow.location.href = data.data.url;
    } else {
      const url = URL.createObjectURL(await response.blob());
      previewWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  } catch (error) {
    previewWindow.close();
    throw error;
  }
};

export const downloadFile = async (id, token, filename = "download") => {
  const res = await authenticatedFetch(`${getFileContentUrl(id)}?download=1`, {
    token,
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
