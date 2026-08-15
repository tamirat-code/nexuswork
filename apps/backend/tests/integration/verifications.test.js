import request from "supertest";
import app from "../../src/app.js";

describe("Verifications module", () => {
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
});