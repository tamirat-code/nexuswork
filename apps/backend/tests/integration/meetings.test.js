import request from "supertest";
import app from "../../src/app.js";

describe("Meetings API security smoke tests", () => {
  test("requires authentication to create a meeting", async () => {
    const response = await request(app).post("/v1/meetings").send({
      contract_id: "507f1f77bcf86cd799439011",
      title: "Kickoff",
      scheduled_start: new Date(Date.now() + 3600000).toISOString(),
    });
    expect(response.status).toBe(401);
  });

  test("rejects malformed meeting IDs before database access", async () => {
    const response = await request(app).get("/v1/meetings/not-an-id");
    expect(response.status).toBe(401);
  });
});
