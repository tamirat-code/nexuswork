import { apiRequest } from "../../lib/http.js";

export const getMyWallet = (token) =>
  apiRequest("/wallets/me", { token });

export const getPayoutStatus = (token) =>
  apiRequest("/wallets/me/payout-status", { token });

export const connectOnboarding = (token) =>
  apiRequest("/wallets/me/connect", {
    method: "POST",
    token,
  });

export const listWalletTransactions = (token) =>
  apiRequest("/wallets/me/transactions", { token });

export const requestWithdrawal = (payload, token) =>
  apiRequest("/wallets/me/withdrawals", {
    method: "POST",
    body: payload,
    token,
  });