import bcrypt from "bcryptjs";
import User from "../modules/users/users.model.js";

export async function seedUsers() {
  const password_hash = await bcrypt.hash("Passw0rd!", 10);
  await User.insertMany([
    { email: "admin@nexuswork.dev", password_hash, name: "Admin", role: "admin" },
    { email: "client@nexuswork.dev", password_hash, name: "Demo Client", role: "client" },
    { email: "student@nexuswork.dev", password_hash, name: "Demo Student", role: "student" },
  ]);
}
