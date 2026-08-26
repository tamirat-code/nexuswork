export function getSessionVersion(user) {
  return Number.isInteger(user?.auth_session_version) ? user.auth_session_version : 0;
}

export function isCurrentSession(payload, user) {
  return Number.isInteger(payload?.sessionVersion) && payload.sessionVersion === getSessionVersion(user);
}
