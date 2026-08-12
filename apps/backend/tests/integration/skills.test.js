import request from "supertest";
import app from "../../src/app.js";

describe("Skills module", () => {
  it("requires auth for skill creation", async () => {
    const res = await request(app).post("/v1/skills");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to update a skill", async () => {
    const res = await request(app).patch("/v1/skills/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to delete a skill", async () => {
    const res = await request(app).delete("/v1/skills/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});