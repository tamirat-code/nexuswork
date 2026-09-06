import { jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";

const sendPasswordResetEmail = jest.fn().mockResolvedValue({ id: "test-mail" });
const mailerModule = fileURLToPath(new URL("../../src/shared/mailer/mailer.service.js", import.meta.url));

jest.unstable_mockModule(mailerModule, () => ({
  sendPasswordResetEmail,
  sendVerificationEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
}));

const { default: User } = await import("../../src/modules/users/users.model.js");
const { PasswordResetToken } = await import("../../src/modules/auth/tokens.model.js");
const { requestPasswordReset } = await import("../../src/modules/auth/auth.service.js");
const { connectTestDB, clearDB, disconnectTestDB } = await import("../helpers/db.js");

const passwordHash = await bcrypt.hash("Password123!", 4);

beforeAll(async () => {
  await connectTestDB();
});

beforeEach(async () => {
  await clearDB();
  sendPasswordResetEmail.mockClear();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("requestPasswordReset", () => {
  it("selects the password hash and sends a reset email for a Google account with a password", async () => {
    const user = await User.create({
      email: "google-password@example.com",
      password_hash: passwordHash,
      auth_provider: "google",
      google_id: "google-with-password",
      role: "student",
      name: "Google Password User",
    });

    await requestPasswordReset(user.email);

    expect(await PasswordResetToken.countDocuments({ user_id: user._id })).toBe(1);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(user.email, expect.any(String));
  });

  it("does not create a token or send email for a Google account without a password", async () => {
    const user = await User.create({
      email: "google-only@example.com",
      auth_provider: "google",
      google_id: "google-without-password",
      role: "student",
      name: "Google Only User",
    });

    await requestPasswordReset(user.email);

    expect(await PasswordResetToken.countDocuments({ user_id: user._id })).toBe(0);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("keeps local-account reset behavior unchanged", async () => {
    const user = await User.create({
      email: "local@example.com",
      password_hash: passwordHash,
      auth_provider: "local",
      role: "client",
      name: "Local User",
    });

    await requestPasswordReset(user.email);

    expect(await PasswordResetToken.countDocuments({ user_id: user._id })).toBe(1);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("keeps unknown-email behavior generic", async () => {
    await requestPasswordReset("unknown@example.com");

    expect(await PasswordResetToken.countDocuments()).toBe(0);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
