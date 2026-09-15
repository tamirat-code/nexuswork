import request from "supertest";
import app from "../../src/app.js";
import { clearDB, connectTestDB, disconnectTestDB } from "../helpers/db.js";
import { createUser } from "../helpers/fixtures.js";
import Organization from "../../src/modules/organizations/organizations.model.js";
import OrgMembership from "../../src/modules/organizations/org-membership.model.js";
import Institution from "../../src/modules/organizations/institutions.model.js";
import InstitutionOnboardingRequest from "../../src/modules/organizations/institution-onboarding-request.model.js";
import File from "../../src/modules/files/files.model.js";
import University from "../../src/modules/universities/universities.model.js";

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

  it("allows organization admins to update workspace settings and institution linkage", async () => {
    const owner = await createUser("client");
    const institution = await Institution.create({ name: "Gondar University", domain: "uog.edu.et", status: "active" });
    const createRes = await request(app)
      .post("/v1/organizations")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ name: "Rose Technologies" });

    const res = await request(app)
      .patch(`/v1/organizations/${createRes.body.data._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        name: "Rose Technologies Ethiopia",
        billing_mode: "consolidated_invoice",
        institution_id: institution._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Rose Technologies Ethiopia");
    expect(res.body.data.billing_mode).toBe("consolidated_invoice");
    expect(String(res.body.data.institution_id._id)).toBe(String(institution._id));
  });

  it("prevents non-admin organization members from updating workspace settings", async () => {
    const owner = await createUser("client");
    const recruiter = await createUser("client");
    const createRes = await request(app).post("/v1/organizations").set("Authorization", `Bearer ${owner.token}`).send({ name: "Acme" });
    await request(app)
      .post(`/v1/organizations/${createRes.body.data._id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: recruiter.user.email, role: "recruiter" })
      .expect(201);

    const res = await request(app)
      .patch(`/v1/organizations/${createRes.body.data._id}`)
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ name: "Acme Updated" });

    expect(res.status).toBe(403);
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
    expect(institution.university_id).not.toBeNull();
    expect(await University.findOne({ domain: "newcollege.edu", contact_staff: requester.user._id })).not.toBeNull();
    expect(await InstitutionOnboardingRequest.countDocuments({ status: "approved" })).toBe(1);

    const visible = await request(app)
      .get("/v1/organizations/institutions/mine")
      .set("Authorization", `Bearer ${requester.token}`);
    expect(visible.status).toBe(200);
    expect(visible.body.data[0].name).toBe("New College");

    const client = await createUser("client");
    const organization = await request(app)
      .post("/v1/organizations")
      .set("Authorization", `Bearer ${client.token}`)
      .send({ name: "New College Partners", institution_id: institution._id.toString() });
    expect(organization.status).toBe(201);
    expect(String(organization.body.data.institution_id._id)).toBe(String(institution._id));
  });

  it("prevents client accounts from submitting institution onboarding requests", async () => {
    const client = await createUser("client");
    const res = await request(app)
      .post("/v1/organizations/institution-onboarding")
      .set("Authorization", `Bearer ${client.token}`)
      .send({
        institutionName: "Client College",
        domain: "clientcollege.edu",
        contactName: "Client Owner",
        contactEmail: client.user.email,
        contactTitle: "Owner",
        evidence_file_id: "507f1f77bcf86cd799439011",
      });

    expect(res.status).toBe(403);
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

  it("allows admins to reject legacy requests without evidence", async () => {
    const requester = await createUser("university_staff");
    const admin = await createUser("admin");
    const legacy = await InstitutionOnboardingRequest.create({
      institutionName: "Legacy College",
      domain: "legacy.edu",
      contactName: "Registrar",
      contactEmail: requester.user.email,
      contactTitle: "Registrar",
      requested_by: requester.user._id,
    });

    const res = await request(app)
      .patch(`/v1/organizations/institution-onboarding/${legacy._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ decision: "rejected", rejectionReason: "Please resubmit with official evidence." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("rejected");
  });
});
