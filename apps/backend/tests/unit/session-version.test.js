import { getSessionVersion, isCurrentSession } from "../../src/modules/auth/session-version.js";

describe("authentication session versioning", () => {
  it("accepts only a token issued for the user's current session version", () => {
    const user = { auth_session_version: 2 };
    expect(isCurrentSession({ sessionVersion: 2 }, user)).toBe(true);
    expect(isCurrentSession({ sessionVersion: 1 }, user)).toBe(false);
    expect(isCurrentSession({}, user)).toBe(false);
  });

  it("defaults legacy users to session version zero", () => {
    expect(getSessionVersion({})).toBe(0);
    expect(isCurrentSession({ sessionVersion: 0 }, {})).toBe(true);
  });
});
