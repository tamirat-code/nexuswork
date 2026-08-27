import request from "supertest";
import app from "../../src/app.js";
import { buildStudentCredential } from "../../src/modules/verifications/verifications.service.js";

describe("Verifications module", () => {
  function makeCredential() {
    return buildStudentCredential({
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
  }

  it("publicly verifies a signed credential", async () => {
    const credential = makeCredential();

    const res = await request(app)
      .post("/v1/verifications/credentials/verify")
      .send({ credential });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.subject).toBe("Hanna Beyene");
    expect(res.body.data.skills[0]).toMatchObject({ name: "React", level: "advanced" });
  });

  it("publicly rejects a tampered credential without requiring auth", async () => {
    const credential = makeCredential();

    const res = await request(app)
      .post("/v1/verifications/credentials/verify")
      .send({
        credential: {
          ...credential,
          credentialSubject: { ...credential.credentialSubject, name: "Fake Expert" },
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.reason).toMatch(/invalid|changed/i);
  });

  it("requires auth to submit a verification request", async () => {
    const res = await request(app)
      .post("/v1/verifications")
      .send({ university_id: "000000000000000000000001" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to list all verification requests", async () => {
    const res = await request(app).get("/v1/verifications");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to certify a student's skill", async () => {
    const res = await request(app)
      .post("/v1/verifications/students/000000000000000000000002/skills/certify")
      .send({ skill_name: "React" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  
  it("rejects unauthenticated submission missing the new required identity fields the same way (401 first)", async () => {
    const res = await request(app)
      .post("/v1/verifications")
      .send({ university_id: "000000000000000000000001" }); // missing full_name/student_id_number/program/document_file_id
    expect(res.status).toBe(401);
  });
});
