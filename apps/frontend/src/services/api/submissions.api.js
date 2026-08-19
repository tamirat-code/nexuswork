import { apiRequest } from "../../lib/http.js";

export const listMilestoneSubmissions = (milestoneId, token) =>
  apiRequest(`/submissions/milestone/${milestoneId}`, { token });

export const requestSubmissionRevision = (submissionId, reason, token) =>
  apiRequest(`/submissions/${submissionId}/request-revision`, {
    method: "POST",
    body: { reason },
    token,
  });