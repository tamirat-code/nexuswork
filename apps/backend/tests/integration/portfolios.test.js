import request from "supertest";
import app from "../../src/app.js";

describe("Portfolios module", () => {
  it("requires auth to create a portfolio item", async () => {
    const res = await request(app).post("/v1/portfolios").send({ title: "My project" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to add a portfolio item from a milestone", async () => {
    const res = await request(app).post("/v1/portfolios/from-milestone/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to respond to milestone portfolio consent", async () => {
    const res = await request(app)
      .patch("/v1/portfolios/000000000000000000000002/consent")
      .send({ decision: "approved" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to view own portfolio", async () => {
    const res = await request(app).get("/v1/portfolios/mine");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});