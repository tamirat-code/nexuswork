import request from "supertest";
import app from "../../src/app.js";

describe("Categories module", () => {
  it("requires auth for category creation", async () => {
    const res = await request(app).post("/v1/categories");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to update a category", async () => {
    const res = await request(app).put("/v1/categories/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to delete a category", async () => {
    const res = await request(app).delete("/v1/categories/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});