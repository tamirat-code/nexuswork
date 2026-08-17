import request from "supertest";
import app from "../../src/app.js";

describe("Disputes module", () => {
  it("requires auth to open a dispute on a milestone", async () => {
    const res = await request(app).post("/v1/disputes/milestone/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to view a dispute's evidence", async () => {
    const res = await request(app).get("/v1/disputes/000000000000000000000002/evidence");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to list open disputes", async () => {
    const res = await request(app).get("/v1/disputes");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to list my own disputes", async () => {
    const res = await request(app).get("/v1/disputes/mine");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to resolve a dispute", async () => {
    const res = await request(app)
      .post("/v1/disputes/000000000000000000000003/resolve")
      .send({ outcome: "refund_client" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});