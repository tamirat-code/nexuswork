import { apiRequest } from "../../lib/http.js";

export const listMyPayments = (token) => apiRequest("/payments", { token });
