import request from "supertest";
import app from "../../src/app.js";

describe("Recommendation module", () => {
  it("requires auth to view my (student) recommendations", async () => {
    const res = await request(app).get("/v1/recommendations/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to view matched students for a project", async () => {
    const res = await request(app).get("/v1/recommendations/project/000000000000000000000001/students");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to get a price suggestion", async () => {
    const res = await request(app).get("/v1/recommendations/price-suggestion?skills=React");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});