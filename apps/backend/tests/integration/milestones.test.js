import request from "supertest";
import app from "../../src/app.js";

describe("Milestones module", () => {
  it("requires auth to list milestones for a contract", async () => {
    const res = await request(app).get("/v1/milestones/contract/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to approve a milestone", async () => {
    const res = await request(app).post("/v1/milestones/000000000000000000000002/approve");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
