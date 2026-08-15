import request from "supertest";
import app from "../../src/app.js";

describe("Reviews module", () => {
  it("requires auth to submit a review", async () => {
    const res = await request(app)
      .post("/v1/reviews/contract/000000000000000000000001")
      .send({ reviewee_id: "000000000000000000000002", rating: 5 });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});