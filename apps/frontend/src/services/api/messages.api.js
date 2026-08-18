import { apiRequest } from "../../lib/http.js";

export const listMessages = async (contractId, token) => {
  const response = await apiRequest(`/messaging/contract/${contractId}`, { token });

 
  const messages = response?.data?.messages;

  return {
    ...response,
    data: Array.isArray(messages) ? messages : [],
  };
};

export const sendMessage = (contractId, body, token) =>
  apiRequest(`/messaging/contract/${contractId}`, {
    method: "POST",
    body: { body },
    token,
  });