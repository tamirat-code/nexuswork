import { buildStudentCredential } from "../../src/modules/verifications/verifications.service.js";

describe("credential export", () => {
  it("builds a VC/Open Badges-shaped document from approved verification data", () => {
    const credential = buildStudentCredential({
      verification: {
        _id: "verification-123",
        full_name: "Hanna Beyene",
        program: "Computer Science",
        reviewed_at: new Date("2026-08-26T00:00:00.000Z"),
        createdAt: new Date("2026-08-25T00:00:00.000Z"),
      },
      university: { name: "Nexus University" },
      user: { _id: "student-123", name: "Hanna Beyene" },
      profile: {
        skills: [{ name: "React", category: "Development", level: "advanced", verification_method: "university_certified" }],
      },
    });

    expect(credential.type).toEqual(["VerifiableCredential", "OpenBadgeCredential"]);
    expect(credential.issuer.name).toBe("NexusWork");
    expect(credential.credentialSubject.name).toBe("Hanna Beyene");
    expect(credential.credentialSubject.achievement.alignment[0].name).toBe("React");
    expect(credential.description).toMatch(/unsigned/);
  });
});
