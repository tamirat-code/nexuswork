import request from "supertest";
import app from "../../src/app.js";

describe("Analytics module", () => {
  it("requires an Authorization header for personal analytics", async () => {
    const res = await request(app).get("/v1/analytics/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
