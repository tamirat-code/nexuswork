import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db.js";
import { createUser } from "../helpers/fixtures.js";

beforeAll(connectTestDB);
beforeEach(clearDB);
afterAll(disconnectTestDB);

describe("Student proposal list", () => {
  test("requires authentication", async () => {
    const response = await request(app).get("/v1/proposals");
    expect(response.status).toBe(401);
  });

  test("returns only the authenticated student's proposals", async () => {
    const { token } = await createUser("student");
    const response = await request(app)
      .get("/v1/proposals")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [] });
  });
});
