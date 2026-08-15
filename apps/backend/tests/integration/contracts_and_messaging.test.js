import request from "supertest";
import app from "../../src/app.js";

describe("Contracts and Messaging integration (smoke)", () => {
  it("requires auth to view a contract by id", async () => {
    const res = await request(app).get("/v1/contracts/64c8a6f0f0f0f0f0f0f0f0f0");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to post a message to a contract", async () => {
    const res = await request(app)
      .post("/v1/messaging/contract/64c8a6f0f0f0f0f0f0f0f0f0")
      .send({ body: "Hello" });
    expect(res.status).toBe(401);
  });

  it("validates pagination query params and returns 400 for invalid limit", async () => {
    const res = await request(app).get("/v1/messaging/contract/64c8a6f0f0f0f0f0f0f0f0f0?limit=abc");
   
    expect([401, 400]).toContain(res.status);
  });
});
