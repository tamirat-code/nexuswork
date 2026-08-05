import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../../services/api/projects.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/forms/FormError.jsx";

export default function PostProjectPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", required_skills: "", budget: "", deadline: "" });
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await createProject(
        {
          ...form,
          budget: Number(form.budget),
          required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
        },
        token
      );
      navigate("/projects");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6">
      <h1 className="text-2xl font-semibold mb-6">Post a Project</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Title" value={form.title} onChange={update("title")} required />
        <textarea
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Description"
          value={form.description}
          onChange={update("description")}
          required
        />
        <Input placeholder="Required skills (comma separated)" value={form.required_skills} onChange={update("required_skills")} />
        <Input type="number" placeholder="Budget (USD)" value={form.budget} onChange={update("budget")} required />
        <Input type="date" value={form.deadline} onChange={update("deadline")} required />
        <FormError message={error} />
        <Button type="submit" className="w-full">
          Post Project
        </Button>
      </form>
    </div>
  );
}
