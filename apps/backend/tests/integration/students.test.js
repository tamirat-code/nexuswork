import request from "supertest";
import app from "../../src/app.js";

describe("Students module", () => {
  it("requires auth to view own profile", async () => {
    const res = await request(app).get("/v1/students/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to update own profile (including skills)", async () => {
    const res = await request(app)
      .patch("/v1/students/me")
      .send({ skills: [{ name: "React", verification_method: "university_certified" }] });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});