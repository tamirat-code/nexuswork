import request from "supertest";
import app from "../../src/app.js";

describe("Files module", () => {
  it("rejects upload without an Authorization header", async () => {
    const res = await request(app).post("/v1/files/upload");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects fetching a file's metadata without an Authorization header", async () => {
    const res = await request(app).get("/v1/files/000000000000000000000000");
    expect(res.status).toBe(401);
  });

  it("returns 404 for a static upload that doesn't exist", async () => {
    const res = await request(app).get("/uploads/does-not-exist.png");
    expect(res.status).toBe(404);
  });
});