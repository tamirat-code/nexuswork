import { apiRequest } from "../../lib/http.js";

export const getMyWallet = (token) => apiRequest("/wallets/me", { token });
export const listWalletTransactions = (token) => apiRequest("/wallets/me/transactions", { token });
export const requestWithdrawal = (payload, token) =>
  apiRequest("/wallets/me/withdrawals", { method: "POST", body: payload, token });
