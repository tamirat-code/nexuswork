import request from "supertest";
import app from "../../src/app.js";

describe("Invoices module", () => {
  it("requires auth to list invoices", async () => {
    const res = await request(app).get("/v1/invoices");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to create an invoice", async () => {
    const res = await request(app)
      .post("/v1/invoices")
      .send({ contract_id: "000000000000000000000001", amount: 100, line_items: [] });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to view a single invoice", async () => {
    const res = await request(app).get("/v1/invoices/000000000000000000000001");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to download an invoice", async () => {
    const res = await request(app).get("/v1/invoices/000000000000000000000001/download");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to update an invoice status", async () => {
    const res = await request(app)
      .patch("/v1/invoices/000000000000000000000001")
      .send({ status: "paid" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});