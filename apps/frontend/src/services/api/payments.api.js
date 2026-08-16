import { apiRequest } from "../../lib/http.js";

export const listMyPayments = (token) => apiRequest("/payments", { token });
export const getPayment = (id, token) => apiRequest(`/payments/${id}`, { token });
