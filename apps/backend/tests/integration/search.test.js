import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db.js";
import { createUser } from "../helpers/fixtures.js";
import StudentProfile from "../../src/modules/students/students.model.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Public search privacy", () => {
  it("returns only active students and never exposes email addresses", async () => {
    const { user: activeStudent } = await createUser("student", { name: "Active Student" });
    const { user: inactiveStudent } = await createUser("student", { name: "Inactive Student", status: "suspended" });
    await StudentProfile.create({ user_id: activeStudent._id, skills: [{ name: "React" }] });
    await StudentProfile.create({ user_id: inactiveStudent._id, skills: [{ name: "React" }] });

    const response = await request(app).get("/v1/search?type=students&q=Student");

    expect(response.status).toBe(200);
    expect(response.body.data.results).toHaveLength(1);
    expect(response.body.data.results[0].user_id.name).toBe("Active Student");
    expect(response.body.data.results[0].user_id).not.toHaveProperty("email");
  });

  it("treats regular-expression metacharacters as literal search text", async () => {
    const { user } = await createUser("student", { name: "Normal Student" });
    await StudentProfile.create({ user_id: user._id, skills: [{ name: "React" }] });

    const response = await request(app).get("/v1/search?type=students&q=.*");

    expect(response.status).toBe(200);
    expect(response.body.data.results).toHaveLength(0);
  });
});
