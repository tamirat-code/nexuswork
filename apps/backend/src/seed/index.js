import "dotenv/config";
import { connectDB } from "../config/database.config.js";
import { seedUsers } from "./users.seed.js";
import { seedSkills } from "./skills.seed.js";
import { seedCategories } from "./categories.seed.js";
import { seedProjects } from "./projects.seed.js";

async function run() {
  await connectDB();
  await seedUsers();
  await seedSkills();
  await seedCategories();
  await seedProjects();
  console.log("Seed complete");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
