import Project from "../modules/projects/projects.model.js";
import User from "../modules/users/users.model.js";

export async function seedProjects() {
  const client = await User.findOne({ role: "client" });
  if (!client) return;
  await Project.create({
    client_id: client._id,
    title: "Build a landing page",
    description: "Simple marketing landing page in React + Tailwind.",
    required_skills: ["React", "Tailwind CSS"],
    budget: 150,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });
}
