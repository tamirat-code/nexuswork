import request from "supertest";
import app from "../../src/app.js";
import { clearDB, connectTestDB, disconnectTestDB } from "../helpers/db.js";
import { createUser } from "../helpers/fixtures.js";
import Organization from "../../src/modules/organizations/organizations.model.js";
import OrgMembership from "../../src/modules/organizations/org-membership.model.js";
import Institution from "../../src/modules/organizations/institutions.model.js";
import InstitutionOnboardingRequest from "../../src/modules/organizations/institution-onboarding-request.model.js";
import File from "../../src/modules/files/files.model.js";

beforeAll(connectTestDB);
beforeEach(clearDB);
afterAll(disconnectTestDB);

describe("Organizations and institutions", () => {
  it("creates an organization with an admin membership", async () => {
    const owner = await createUser("client");
    const res = await request(app)
      .post("/v1/organizations")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ name: "Nexus Studio", billing_mode: "escrow" });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Nexus Studio");
    expect(await Organization.countDocuments()).toBe(1);
    expect(await OrgMembership.findOne({ user_id: owner.user._id, role: "admin", status: "active" })).not.toBeNull();
  });

  it("enforces organization admin permissions for member management", async () => {
    const owner = await createUser("client");
    const recruiter = await createUser("client");
    const invitee = await createUser("client");
    const createRes = await request(app).post("/v1/organizations").set("Authorization", `Bearer ${owner.token}`).send({ name: "Acme" });
    const organizationId = createRes.body.data._id;

    await request(app)
      .post(`/v1/organizations/${organizationId}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: recruiter.user.email, role: "recruiter" })
      .expect(201);

    const forbidden = await request(app)
      .post(`/v1/organizations/${organizationId}/members`)
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ email: invitee.user.email, role: "billing_viewer" });
    expect(forbidden.status).toBe(403);

    const members = await request(app)
      .get(`/v1/organizations/${organizationId}/members`)
      .set("Authorization", `Bearer ${recruiter.token}`);
    expect(members.status).toBe(200);
    expect(members.body.data).toHaveLength(2);
  });

  it("prevents removing the last organization admin", async () => {
    const owner = await createUser("client");
    const createRes = await request(app).post("/v1/organizations").set("Authorization", `Bearer ${owner.token}`).send({ name: "Solo Org" });
    const membership = await OrgMembership.findOne({ organization_id: createRes.body.data._id, user_id: owner.user._id });

    const res = await request(app)
      .delete(`/v1/organizations/${createRes.body.data._id}/members/${owner.user._id}`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(res.status).toBe(400);
    expect(membership.status).toBe("active");
  });

  it("allows a user to request institution onboarding and an admin to approve it", async () => {
    const requester = await createUser("university_staff", { email: "registrar@newcollege.edu" });
    const admin = await createUser("admin");
    const evidence = await File.create({ owner_id: requester.user._id, filename: "evidence.pdf", original_name: "evidence.pdf", mimetype: "application/pdf", size: 1024, url: "https://example.test/evidence.pdf", related_type: "institution_onboarding_evidence" });
    const requestRes = await request(app)
      .post("/v1/organizations/institution-onboarding")
      .set("Authorization", `Bearer ${requester.token}`)
      .send({
        institutionName: "New College",
        domain: "newcollege.edu",
        contactName: "Registrar",
        contactEmail: requester.user.email,
        contactTitle: "Registrar",
        evidence_file_id: evidence._id.toString(),
      });

    expect(requestRes.status).toBe(201);
    const decision = await request(app)
      .patch(`/v1/organizations/institution-onboarding/${requestRes.body.data._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ decision: "approved" });

    expect(decision.status).toBe(200);
    expect(decision.body.data.status).toBe("approved");
    const institution = await Institution.findOne({ domain: "newcollege.edu" });
    expect(institution).not.toBeNull();
    expect(institution.staff_admin_ids.map(String)).toContain(String(requester.user._id));
    expect(await InstitutionOnboardingRequest.countDocuments({ status: "approved" })).toBe(1);
  });

  it("rejects duplicate institution domains", async () => {
    const requester = await createUser("university_staff");
    await Institution.create({ name: "Existing", domain: "existing.edu" });
    const evidence = await File.create({ owner_id: requester.user._id, filename: "evidence.pdf", original_name: "evidence.pdf", mimetype: "application/pdf", size: 1024, url: "https://example.test/evidence.pdf", related_type: "institution_onboarding_evidence" });
    const res = await request(app)
      .post("/v1/organizations/institution-onboarding")
      .set("Authorization", `Bearer ${requester.token}`)
      .send({ institutionName: "Existing", domain: "existing.edu", contactName: "Staff", contactEmail: requester.user.email, contactTitle: "Registrar", evidence_file_id: evidence._id.toString() });
    expect(res.status).toBe(409);
  });
});
