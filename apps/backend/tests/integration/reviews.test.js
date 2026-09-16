import request from "supertest";
import app from "../../src/app.js";
import { buildReputationExport } from "../../src/modules/reviews/reviews.service.js";

describe("Reviews module", () => {
  it("requires auth to submit a review", async () => {
    const res = await request(app)
      .post("/v1/reviews/contract/000000000000000000000001")
      .send({ reviewee_id: "000000000000000000000002", rating: 5 });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("publicly verifies a signed reputation export without exposing its payload", async () => {
    const document = buildReputationExport({
      user: { _id: "student-123", name: "Hanna Beyene" },
      reviews: [{ _id: "review-1", rating: 5, createdAt: new Date("2026-08-26") }],
    });

    const res = await request(app)
      .post("/v1/reviews/reputation/verify")
      .send({ document });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.ratings).toBe(1);
    expect(res.body.data).not.toHaveProperty("document");
  });

  it("rejects a tampered reputation export", async () => {
    const document = buildReputationExport({ user: { _id: "student-123", name: "Hanna Beyene" } });
    document.credentialSubject.name = "Changed after export";

    const res = await request(app)
      .post("/v1/reviews/reputation/verify")
      .send({ document });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
  });
});
