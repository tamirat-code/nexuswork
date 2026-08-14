import request from "supertest";
import app from "../../src/app.js";

describe("Webhooks", () => {
  it("rejects requests with invalid/missing stripe signature", async () => {
    const res = await request(app)
      .post("/webhooks/stripe")
      .send(JSON.stringify({ some: "payload" }))
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
    expect(res.text).toMatch(/Webhook signature verification failed/);
  });
});
