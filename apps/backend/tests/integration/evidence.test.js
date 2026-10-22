import { jest } from "@jest/globals";
import { createUser, createActiveContractWithMilestone } from "../helpers/fixtures.js";
import RepositoryConnection from "../../src/modules/evidence/repository-connection.model.js";
import TaskArtifact from "../../src/modules/evidence/task-artifact.model.js";
import { encryptRepositoryToken } from "../../src/modules/evidence/repository-token.js";
import { syncRepository } from "../../src/modules/evidence/evidence.service.js";

describe("Repository work evidence", () => {
  afterEach(() => jest.restoreAllMocks());

  it("imports paginated commits incrementally and remains idempotent", async () => {
    const { user: client } = await createUser("client");
    const { user: student } = await createUser("student");
    const { contract, milestone } = await createActiveContractWithMilestone({ client, student });
    const firstCommitDate = new Date(Date.now() - 60_000).toISOString();
    const secondCommitDate = new Date(Date.now() - 30_000).toISOString();
    const connection = await RepositoryConnection.create({
      contract_id: contract._id,
      student_id: student._id,
      provider: "github",
      provider_user_id: "42",
      provider_repository_id: "99",
      repository: "student/project",
      token_encrypted: encryptRepositoryToken("test-token"),
    });
    const fetchMock = jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { sha: "a".repeat(40), html_url: "https://github.com/student/project/commit/a", commit: { message: "first", author: { name: "Student", date: firstCommitDate } }, author: { id: 42 } },
        { sha: "b".repeat(40), html_url: "https://github.com/student/project/commit/b", commit: { message: "second", author: { name: "Student", date: secondCommitDate } }, author: { id: 42 } },
      ]), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));

    const first = await syncRepository(connection._id, { _id: student._id, role: "student" }, { milestoneId: milestone._id });
    expect(first.imported).toBe(2);
    expect(first.connection.token_encrypted).toBeUndefined();
    expect(await TaskArtifact.countDocuments({ repository_connection_id: connection._id })).toBe(2);
    expect(await TaskArtifact.countDocuments({ repository_connection_id: connection._id, milestone_id: milestone._id })).toBe(2);

    const second = await syncRepository(connection._id, { _id: student._id, role: "student" });
    expect(second.imported).toBe(0);
    expect(fetchMock.mock.calls[1][0]).toContain("since=");
    expect(await TaskArtifact.countDocuments({ repository_connection_id: connection._id })).toBe(2);
    expect((await RepositoryConnection.findById(connection._id)).last_synced_commit_at).not.toBeNull();
  });

  it("marks provider authorization failures for reauthorization without leaking the token", async () => {
    const { user: client } = await createUser("client");
    const { user: student } = await createUser("student");
    const { contract } = await createActiveContractWithMilestone({ client, student });
    const connection = await RepositoryConnection.create({
      contract_id: contract._id,
      student_id: student._id,
      provider: "github",
      provider_user_id: "42",
      provider_repository_id: "99",
      repository: "student/project",
      token_encrypted: encryptRepositoryToken("test-token"),
    });
    jest.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));

    await expect(syncRepository(connection._id, { _id: student._id, role: "student" })).rejects.toMatchObject({ code: "PROVIDER_AUTH_FAILED" });
    const saved = await RepositoryConnection.findById(connection._id).select("+token_encrypted");
    expect(saved.status).toBe("needs_reauthorization");
    expect(saved.token_encrypted).toBeTruthy();
  });
});
