import request from "supertest";
import app from "../../src/app.js";

describe("Auth module", () => {
  it("rejects access to the authenticated profile route without a token", async () => {
    const res = await request(app).get("/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("validates required fields before registering a user", async () => {
    const res = await request(app).post("/v1/auth/register").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("email");
    expect(res.body.message).toContain("password");
  });
});
