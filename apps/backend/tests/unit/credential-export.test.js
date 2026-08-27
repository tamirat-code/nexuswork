import { buildStudentCredential } from "../../src/modules/verifications/verifications.service.js";
import {
  canonicalizeCredential,
  getCredentialIssuerPublicKey,
  verifyCredentialProof,
} from "../../src/modules/verifications/credential-signing.js";
import { renderCredentialCardPdf } from "../../src/templates/credential/credential-card.pdf.js";
import { createPublicKey, verify } from "node:crypto";

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
    expect(credential.description).toMatch(/signed/);
    expect(credential.proof.type).toBe("Ed25519Signature2020");
    expect(credential.proof.verificationMethod).toMatch(/nexuswork-issuer-key$/);

    const { proof, ...unsignedCredential } = credential;
    const publicKey = createPublicKey(getCredentialIssuerPublicKey().publicKeyPem);
    expect(verify(
      null,
      Buffer.from(canonicalizeCredential(unsignedCredential)),
      publicKey,
      Buffer.from(proof.proofValue, "base64url")
    )).toBe(true);
    expect(verifyCredentialProof(credential)).toEqual({
      valid: true,
      reason: "Credential signature is valid",
    });
    expect(verifyCredentialProof(JSON.parse(JSON.stringify(credential)))).toEqual({
      valid: true,
      reason: "Credential signature is valid",
    });
  });

  it("rejects a credential whose signed content was changed", () => {
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
      profile: { skills: [] },
    });

    const tampered = {
      ...credential,
      credentialSubject: {
        ...credential.credentialSubject,
        name: "Fake Expert",
      },
    };

    expect(verifyCredentialProof(tampered)).toEqual({
      valid: false,
      reason: "Credential signature is invalid or the credential was changed",
    });
  });

  it("rejects a credential without a proof value", () => {
    const { proof, ...unsignedCredential } = buildStudentCredential({
      verification: {
        _id: "verification-123",
        full_name: "Hanna Beyene",
        program: "Computer Science",
        reviewed_at: new Date("2026-08-26T00:00:00.000Z"),
        createdAt: new Date("2026-08-25T00:00:00.000Z"),
      },
      university: { name: "Nexus University" },
      user: { _id: "student-123", name: "Hanna Beyene" },
      profile: { skills: [] },
    });

    expect(verifyCredentialProof(unsignedCredential)).toEqual({
      valid: false,
      reason: "Credential is missing a proof value",
    });
  });

  it("renders the human-readable credential card as a PDF", async () => {
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
      profile: { skills: [] },
    });

    const pdf = await renderCredentialCardPdf(credential);

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });

});
