import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db.js";
import { createUser } from "../helpers/fixtures.js";
import StudentProfile from "../../src/modules/students/students.model.js";
import Project from "../../src/modules/projects/projects.model.js";
import LearningResource from "../../src/modules/learning/learning.model.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Recommendation module", () => {
  it("requires auth to view my (student) recommendations", async () => {
    const res = await request(app).get("/v1/recommendations/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to view my career recommendation", async () => {
    const res = await request(app).get("/v1/recommendations/career");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to view matched students for a project", async () => {
    const res = await request(app).get("/v1/recommendations/project/000000000000000000000001/students");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("requires auth to get a price suggestion", async () => {
    const res = await request(app).get("/v1/recommendations/price-suggestion?skills=React");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  describe("Career recommendation (§4.15)", () => {
    it("surfaces the highest-demand skill the student doesn't have yet, with a matching resource", async () => {
      const { user: client } = await createUser("client");
      const { user: student, token } = await createUser("student");

      await StudentProfile.create({
        user_id: student._id,
        skills: [{ name: "JavaScript", category: "programming", level: "intermediate" }],
      });

      // 3 open projects want Kubernetes, 1 wants JavaScript — Kubernetes is
      // the bigger gap even though it's not the only skill in demand.
      await Project.create([
        { client_id: client._id, title: "P1", description: "d", required_skills: ["Kubernetes"], budget: 500, deadline: new Date(Date.now() + 86400000), status: "open" },
        { client_id: client._id, title: "P2", description: "d", required_skills: ["Kubernetes"], budget: 500, deadline: new Date(Date.now() + 86400000), status: "open" },
        { client_id: client._id, title: "P3", description: "d", required_skills: ["Kubernetes"], budget: 500, deadline: new Date(Date.now() + 86400000), status: "in_progress" },
        { client_id: client._id, title: "P4", description: "d", required_skills: ["JavaScript"], budget: 500, deadline: new Date(Date.now() + 86400000), status: "open" },
      ]);

      await LearningResource.create({
        title: "Kubernetes Fundamentals",
        category: "Kubernetes",
        resource_type: "course",
        url: "https://example.com/k8s",
        is_published: true,
      });

      const res = await request(app)
        .get("/v1/recommendations/career")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.current_skills).toEqual(["JavaScript"]);

      const topGap = res.body.data.skill_path[0];
      expect(topGap.name).toBe("kubernetes");
      expect(topGap.demand_count).toBe(3);
      expect(topGap.resources[0].title).toBe("Kubernetes Fundamentals");

      // JavaScript is already a listed skill, so it must not appear as a gap.
      expect(res.body.data.skill_path.some((s) => s.name === "javascript")).toBe(false);
    });

    it("excludes cancelled/completed projects from demand and returns a plain-language summary without an AI key configured", async () => {
      const { user: client } = await createUser("client");
      const { user: student, token } = await createUser("student");

      await StudentProfile.create({ user_id: student._id, skills: [] });

      await Project.create([
        { client_id: client._id, title: "Stale", description: "d", required_skills: ["Rust"], budget: 500, deadline: new Date(Date.now() + 86400000), status: "completed" },
        { client_id: client._id, title: "Dead", description: "d", required_skills: ["Rust"], budget: 500, deadline: new Date(Date.now() + 86400000), status: "cancelled" },
        { client_id: client._id, title: "Live", description: "d", required_skills: ["Go"], budget: 500, deadline: new Date(Date.now() + 86400000), status: "open" },
      ]);

      const res = await request(app)
        .get("/v1/recommendations/career")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.skill_path.map((s) => s.name)).toEqual(["go"]);
      expect(res.body.data.summary).toMatch(/go/i);
    });

    it("requires a student profile to exist", async () => {
      const { token } = await createUser("student");

      const res = await request(app)
        .get("/v1/recommendations/career")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("rejects non-students", async () => {
      const { token } = await createUser("client");

      const res = await request(app)
        .get("/v1/recommendations/career")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});