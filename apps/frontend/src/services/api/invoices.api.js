import { apiRequest, authenticatedFetch, csrfHeaders } from "../../lib/http.js";
import { logger } from "../../lib/logger.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/v1";

export const listMyInvoices = (token) => apiRequest("/invoices", { token });
export const getInvoice = (id, token) => apiRequest(`/invoices/${id}`, { token });

export async function downloadInvoice(id, token, format = "pdf") {
  const res = await authenticatedFetch(`${API_BASE_URL}/invoices/${id}/download?format=${format}`, {
    token,
    headers: csrfHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.message || `Download failed with status ${res.status}`);
    error.status = res.status;
    logger.error("Invoice download failed", error, { invoiceId: id, format, status: res.status });
    throw error;
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `invoice.${format}`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
