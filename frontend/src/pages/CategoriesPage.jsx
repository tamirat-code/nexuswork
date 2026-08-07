import { useState } from "react";
import { Plus, Edit2, Trash2, FolderOpen } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { MOCK_CATEGORIES } from "../data/categories";

export default function CategoriesPage() {
  const { notify } = useNotifications();
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const deleteCategory = (id) => {
    if (confirm("Are you sure? This will remove the category from all projects.")) {
      setCategories(prev => prev.filter(c => c.id !== id));
      notify("Category deleted", "success");
    }
  };

  const toggleStatus = (id) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, status: c.status === "active" ? "inactive" : "active" } : c));
    notify("Category status updated", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Categories</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Manage project and skill categories.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{cat.projects} projects</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cat.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/10 text-slate-600 dark:text-zinc-400"}`}>
                {cat.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {cat.skills.slice(0, 3).map((skill) => (
                <span key={skill} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/5 dark:text-zinc-300">
                  {skill}
                </span>
              ))}
              {cat.skills.length > 3 && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-white/5 dark:text-zinc-500">
                  +{cat.skills.length - 3}
                </span>
              )}
            </div>

            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-white/5">
              <button
                onClick={() => setEditingCategory(cat)}
                className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                <Edit2 className="inline h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => toggleStatus(cat.id)}
                className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                {cat.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingCategory) && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setShowAddModal(false); setEditingCategory(null); }}
          onSave={(cat) => {
            if (editingCategory) {
              setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
              notify("Category updated", "success");
            } else {
              setCategories(prev => [...prev, { ...cat, id: Date.now() }]);
              notify("Category added", "success");
            }
            setShowAddModal(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

function CategoryModal({ category, onClose, onSave }) {
  const [form, setForm] = useState(category || { name: "", slug: "", skills: [], status: "active" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          {category ? "Edit Category" : "Add Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">Skills (comma-separated)</label>
            <input
              type="text"
              value={form.skills.join(", ")}
              onChange={(e) => setForm({ ...form, skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
              placeholder="React, Node.js, TypeScript"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 dark:border-white/10 dark:text-zinc-300">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
              {category ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}