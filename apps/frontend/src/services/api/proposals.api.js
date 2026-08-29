import { apiRequest } from "../../lib/http.js";



export const submitProposal = (
  payload,
  token
) =>
  apiRequest("/proposals", {
    method: "POST",
    body: payload,
    token,
  });



export const listProjectProposals = (
  projectId,
  token
) =>
  apiRequest(
    `/proposals/project/${projectId}`,
    {
      token,
    }
  );



export const listIncomingProposals = (
  token
) =>
  apiRequest(
    "/proposals/incoming",
    {
      token,
    }
  );



export const listMyProposals = (
  token
) =>
  apiRequest(
    "/proposals",
    {
      token,
    }
  );

export const getCommissionPreview = (params, token) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, value);
  });
  return apiRequest(`/proposals/commission-preview?${query.toString()}`, { token });
};



export const acceptProposal = (
  id,
  token
) =>
  apiRequest(
    `/proposals/${id}/accept`,
    {
      method: "POST",
      token,
    }
  );

export const markProposalCvViewed = (id, token) =>
  apiRequest(`/proposals/${id}/cv-viewed`, { method: "POST", token });



export const rejectProposal = (
  id,
  token
) =>
  apiRequest(
    `/proposals/${id}/reject`,
    {
      method: "POST",
      token,
    }
  );



export const withdrawProposal = (
  id,
  token
) =>
  apiRequest(
    `/proposals/${id}`,
    {
      method: "DELETE",
      token,
    }
  );
