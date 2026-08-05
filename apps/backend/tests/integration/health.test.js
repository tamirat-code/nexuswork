import request from "supertest";
import app from "../../src/app.js";

describe("GET /v1/health", () => {
  it("returns 200 and status ok", async () => {
    const res = await request(app).get("/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });
});
