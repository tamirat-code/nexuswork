import { apiRequest } from "../../lib/http.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/v1";

export const getVerifications = (query = "", token) => apiRequest(`/verifications${query}`, { token });
export const getMyVerifications = (token) => apiRequest("/verifications/mine", { token });
export const getVerificationStats = (token) => apiRequest("/verifications/stats", { token });
export const reviewVerification = (id, payload, token) =>
  apiRequest(`/verifications/${id}/review`, { method: "PATCH", body: payload, token });
export const requestVerification = (payload, token) =>
  apiRequest("/verifications", { method: "POST", body: payload, token });
export const exportMyCredential = (verificationId, token) =>
  apiRequest(`/verifications/mine/${verificationId}/credential`, { token });
export const verifyCredential = (credential) =>
  apiRequest("/verifications/credentials/verify", { method: "POST", body: { credential } });

export async function downloadCredentialCardPdf(verificationId, token) {
  const res = await fetch(`${API_BASE_URL}/verifications/mine/${verificationId}/credential/card`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Download failed with status ${res.status}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `nexuswork-credential-card-${verificationId}.pdf`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
