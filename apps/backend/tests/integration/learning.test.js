import request from "supertest";
import app from "../../src/app.js";

describe("Learning module", () => {
  it("requires auth for learning content creation", async () => {
    const res = await request(app).post("/v1/learning");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to update learning content", async () => {
    const res = await request(app).patch("/v1/learning/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to delete learning content", async () => {
    const res = await request(app).delete("/v1/learning/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});