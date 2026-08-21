import request from "supertest";
import app from "../../src/app.js";

describe("Submissions module", () => {
  it("requires auth to list milestone submissions", async () => {
    const res = await request(app).get("/v1/submissions/milestone/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to request a revision", async () => {
    const res = await request(app)
      .post("/v1/submissions/000000000000000000000001/request-revision")
      .send({ reason: "Please correct the missing methodology section." });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});