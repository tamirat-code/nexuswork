import request from "supertest";
import app from "../../src/app.js";

describe("Payments module", () => {
  it("requires auth to view personal payments", async () => {
    const res = await request(app).get("/v1/payments");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
