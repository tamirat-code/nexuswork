import { apiRequest } from "../../lib/http.js";

export const listMyInvoices = (token) => apiRequest("/invoices", { token });
export const getInvoice = (id, token) => apiRequest(`/invoices/${id}`, { token });
