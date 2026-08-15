import request from "supertest";
import app from "../../src/app.js";

describe("Clients module", () => {
  it("requires auth to view own client profile", async () => {
    const res = await request(app).get("/v1/clients/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to submit client verification", async () => {
    const res = await request(app).post("/v1/clients/me/verification");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to list client verifications", async () => {
    const res = await request(app).get("/v1/clients/verifications");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to review a client verification", async () => {
    const res = await request(app)
      .patch("/v1/clients/verifications/000000000000000000000001/review")
      .send({ decision: "approved" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to add an additional poster", async () => {
    const res = await request(app)
      .post("/v1/clients/me/posters")
      .send({ user_id: "000000000000000000000002" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to remove an additional poster", async () => {
    const res = await request(app).delete("/v1/clients/me/posters/000000000000000000000002");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});