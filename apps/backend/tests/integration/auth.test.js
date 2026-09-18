import request from "supertest";
import crypto from "node:crypto";
import app from "../../src/app.js";
import User from "../../src/modules/users/users.model.js";
import { EmailVerificationToken, PasswordResetToken } from "../../src/modules/auth/tokens.model.js";
import { resetPassword } from "../../src/modules/auth/auth.service.js";
import { createUser } from "../helpers/fixtures.js";
import { connectTestDB, disconnectTestDB } from "../helpers/db.js";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Auth module", () => {
  it("rejects access to the authenticated profile route without a token", async () => {
    const res = await request(app).get("/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("validates required fields before registering a user", async () => {
    const res = await request(app).post("/v1/auth/register").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("email");
    expect(res.body.message).toContain("password");
  });

  it("invalidates existing sessions after a password reset", async () => {
    const { user, token } = await createUser("client");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await PasswordResetToken.create({
      user_id: user._id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 60_000),
    });

    await resetPassword(rawToken, "NewPassword123!");
    const refreshedUser = await User.findById(user._id);
    expect(refreshedUser.auth_session_version).toBe(1);
    await request(app).get("/v1/auth/me").set("Authorization", `Bearer ${token}`).expect(401);
  });

  it("verifies an email once and rejects replayed verification links", async () => {
    const { user } = await createUser("client", { email_verified: false });
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await EmailVerificationToken.create({
      user_id: user._id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 60_000),
    });

    await request(app).post("/v1/auth/verify-email").send({ token: rawToken }).expect(200);
    const verifiedUser = await User.findById(user._id);
    expect(verifiedUser.email_verified).toBe(true);

    await request(app).post("/v1/auth/verify-email").send({ token: rawToken }).expect(400);
  });
});
