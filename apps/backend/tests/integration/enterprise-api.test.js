import request from "supertest";
import app from "../../src/app.js";
import { clearDB, connectTestDB, disconnectTestDB } from "../helpers/db.js";
import { createUser } from "../helpers/fixtures.js";

beforeAll(connectTestDB);
let partnerSequence = 0;
beforeEach(async () => {
  partnerSequence = 0;
  await clearDB();
});
afterAll(disconnectTestDB);

async function provisionPartner(scopes = ["talent:read", "webhooks:manage", "usage:read"]) {
  const admin = await createUser("admin");
  partnerSequence += 1;
  const response = await request(app)
    .post("/v1/admin/api-partners")
    .set("Authorization", `Bearer ${admin.token}`)
    .send({ name: `Talent Integrations ${partnerSequence}`, contact_email: `api${partnerSequence}@example.com`, scopes });
  expect(response.status).toBe(201);
  return { admin, partner: response.body.data.partner, apiKey: response.body.data.api_key };
}

describe("Enterprise partner API", () => {
  it("keeps the partner boundary separate from browser authentication", async () => {
    const { admin, partner, apiKey } = await provisionPartner();

    const browserAttempt = await request(app)
      .get("/partner/v1/me")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(browserAttempt.status).toBe(401);
    expect(browserAttempt.body.code).toBe("PARTNER_API_KEY_REQUIRED");

    const profile = await request(app)
      .get("/partner/v1/me")
      .set("X-NexusWork-API-Key", apiKey);
    expect(profile.status).toBe(200);
    expect(String(profile.body.data._id)).toBe(String(partner._id));
    expect(profile.body.data.usage.requestCount).toBeGreaterThan(0);

    const billing = await request(app)
      .get("/partner/v1/me/billing")
      .set("X-NexusWork-API-Key", apiKey);
    expect(billing.status).toBe(200);
    expect(billing.body.data.current.request_count).toBeGreaterThan(0);

    const adminBilling = await request(app)
      .get(`/v1/admin/api-partners/${partner._id}/billing`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(adminBilling.status).toBe(200);
    expect(adminBilling.body.data[0].request_count).toBeGreaterThan(0);
  });

  it("supports partner self-service key lifecycle with one-time issuance", async () => {
    const { apiKey } = await provisionPartner(["talent:read"]);

    const created = await request(app)
      .post("/partner/v1/me/keys")
      .set("X-NexusWork-API-Key", apiKey)
      .send({ name: "Production rotation key", scopes: ["talent:read"] });
    expect(created.status).toBe(201);
    expect(created.body.data.api_key).toMatch(/^nw_/);

    const revoked = await request(app)
      .post(`/partner/v1/me/keys/${created.body.data.key._id}/revoke`)
      .set("X-NexusWork-API-Key", apiKey);
    expect(revoked.status).toBe(200);
    expect(revoked.body.data.active).toBe(false);
  });

  it("enforces webhook scope and supports subscription lifecycle", async () => {
    const limited = await provisionPartner(["talent:read"]);
    const forbidden = await request(app)
      .get("/partner/v1/me/webhooks")
      .set("X-NexusWork-API-Key", limited.apiKey);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.code).toBe("PARTNER_SCOPE_REQUIRED");

    const enabled = await provisionPartner();
    const created = await request(app)
      .post("/partner/v1/me/webhooks")
      .set("X-NexusWork-API-Key", enabled.apiKey)
      .send({ url: "http://localhost:4321/nexuswork-hook", events: ["usage.threshold"] });
    expect(created.status).toBe(201);
    expect(created.body.data.webhook_secret).toMatch(/^whsec_/);

    const listed = await request(app)
      .get("/partner/v1/me/webhooks")
      .set("X-NexusWork-API-Key", enabled.apiKey);
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);
    expect(listed.body.data[0].secret_encrypted).toBeUndefined();

    const rotated = await request(app)
      .post(`/partner/v1/me/webhooks/${listed.body.data[0]._id}/rotate-secret`)
      .set("X-NexusWork-API-Key", enabled.apiKey);
    expect(rotated.status).toBe(200);
    expect(rotated.body.data.webhook_secret).toMatch(/^whsec_/);
    expect(rotated.body.data.webhook_secret).not.toBe(created.body.data.webhook_secret);

    const disabled = await request(app)
      .delete(`/partner/v1/me/webhooks/${listed.body.data[0]._id}`)
      .set("X-NexusWork-API-Key", enabled.apiKey);
    expect(disabled.status).toBe(200);
    expect(disabled.body.data.status).toBe("disabled");
  });
});
