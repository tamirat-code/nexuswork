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
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="max-w-lg">
        <h1 className="mb-6 font-display text-3xl text-slate">Post a Project</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Title" value={form.title} onChange={update("title")} required />
          <textarea
            className="w-full rounded-control border border-ink-300 bg-ink-50 px-3.5 py-2.5 text-sm text-slate placeholder:text-slate-300 transition-colors duration-150 hover:border-brass focus:outline-none"
            rows={5}
            placeholder="Description"
            value={form.description}
            onChange={update("description")}
            required
          />
          <Input
            placeholder="Required skills (comma separated)"
            value={form.required_skills}
            onChange={update("required_skills")}
          />
          <Input type="number" placeholder="Budget (USD)" value={form.budget} onChange={update("budget")} required />
          <Input type="date" value={form.deadline} onChange={update("deadline")} required />
          <FormError message={error} />
          <Button type="submit" className="w-full">
            Post Project
          </Button>
        </form>
      </div>
    </div>
  );
}