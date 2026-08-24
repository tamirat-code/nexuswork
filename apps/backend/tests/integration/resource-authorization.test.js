import mongoose from "mongoose";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db.js";
import { createUser, createActiveContractWithMilestone } from "../helpers/fixtures.js";
import ClientProfile from "../../src/modules/clients/clients.model.js";
import {
  assertContractParty,
  assertClientOnContract,
  assertStudentOnContract,
  assertOrganizationMember,
  assertMilestoneAccess,
} from "../../src/shared/authorization/resource-authorization.js";
import { permissions } from "../../src/shared/permissions/permissions.js";

beforeAll(connectTestDB);
beforeEach(clearDB);
afterAll(disconnectTestDB);

describe("centralized resource authorization", () => {
  test("authenticated contract client and student can access their contract", async () => {
    const { user: client } = await createUser("client");
    const { user: student } = await createUser("student");
    const { contract } = await createActiveContractWithMilestone({ client, student });

    await expect(assertClientOnContract({ contractId: contract._id, user: client })).resolves.toMatchObject({ _id: contract._id });
    await expect(assertStudentOnContract({ contractId: contract._id, user: student })).resolves.toMatchObject({ _id: contract._id });
  });

  test("unrelated users, clients, and unassigned students are rejected", async () => {
    const { user: client } = await createUser("client");
    const { user: student } = await createUser("student");
    const { user: otherClient } = await createUser("client");
    const { user: otherStudent } = await createUser("student");
    const { contract } = await createActiveContractWithMilestone({ client, student });

    await expect(assertContractParty({ contractId: contract._id, user: otherClient })).rejects.toMatchObject({ status: 403 });
    await expect(assertClientOnContract({ contractId: contract._id, user: otherClient })).rejects.toMatchObject({ status: 403 });
    await expect(assertStudentOnContract({ contractId: contract._id, user: otherStudent })).rejects.toMatchObject({ status: 403 });
    await expect(assertContractParty({ contractId: contract._id, user: otherStudent })).rejects.toMatchObject({ status: 403 });
  });

  test("uses authenticated req.user instead of forged user or body identity", async () => {
    const { user: client } = await createUser("client");
    const { user: otherClient } = await createUser("client");
    const { user: student } = await createUser("student");
    const { contract } = await createActiveContractWithMilestone({ client, student });
    const req = {
      user: client,
      body: { userId: otherClient._id, clientId: otherClient._id, role: "admin" },
    };

    await expect(assertClientOnContract({ contractId: contract._id, req, user: otherClient })).resolves.toMatchObject({ _id: contract._id });
    await expect(assertClientOnContract({ contractId: contract._id, req: { user: otherClient }, user: client })).rejects.toMatchObject({ status: 403 });
  });

  test("preserves organization-member access without mutating the resource", async () => {
    const { user: owner } = await createUser("client");
    const { user: poster } = await createUser("client");
    const { user: student } = await createUser("student");
    const { contract, milestone } = await createActiveContractWithMilestone({ client: owner, student });
    await ClientProfile.create({ user_id: owner._id, additional_posters: [poster._id] });

    const before = milestone.toObject();
    await expect(assertOrganizationMember({ ownerUserId: owner._id, user: poster })).resolves.toMatchObject({ _id: poster._id });
    await expect(assertClientOnContract({ contractId: contract._id, user: poster })).resolves.toMatchObject({ _id: contract._id });
    await expect(assertMilestoneAccess({ milestoneId: milestone._id, user: poster, role: "client" })).resolves.toBeTruthy();
    const after = await mongoose.model("Milestone").findById(milestone._id).lean();
    expect(after.status).toBe(before.status);
    expect(after.revision_count).toBe(before.revision_count);
  });

  test("admin is not silently granted party access", async () => {
    const { user: client } = await createUser("client");
    const { user: student } = await createUser("student");
    const { user: admin } = await createUser("admin");
    const { contract } = await createActiveContractWithMilestone({ client, student });

    await expect(assertContractParty({ contractId: contract._id, user: admin })).rejects.toMatchObject({ status: 403 });
  });

  test("permission vocabulary is explicit for contract resources", () => {
    expect(permissions.contract).toEqual(expect.objectContaining({ read: expect.any(Array), sign: expect.any(Array) }));
    expect(permissions.milestone).toEqual(expect.objectContaining({ fund: expect.any(Array), release: expect.any(Array) }));
    expect(permissions.payment).toEqual(expect.objectContaining({ fund: expect.any(Array), release: expect.any(Array) }));
  });
});
