import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../../services/api/categories.api.js";
import { listSkills, updateSkill } from "../../services/api/skills.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Textarea } from "../../components/ui/shadcn/textarea.jsx";
import { Switch } from "../../components/ui/shadcn/switch.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/shadcn/dialog.jsx";
import { reportValidation } from "../../lib/validation.js";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EMPTY_FORM = { name: "", slug: "", description: "", icon: "", sort_order: 0, proposal_price_floor: "" };

function CategoryFormDialog({ token, category, trigger }) {
  const qc = useQueryClient();
  const isEdit = Boolean(category);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          icon: category.icon || "",
          sort_order: category.sort_order ?? 0,
          proposal_price_floor: category.proposal_price_floor_minor ? String(category.proposal_price_floor_minor / 100) : "",
        }
      : EMPTY_FORM
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [error, setError] = useState("");

  function validate() {
    const price = Number(form.proposal_price_floor || 0);
    const sort = Number(form.sort_order);
    const message = !form.name.trim() ? "Enter a category name." : !form.slug.trim() ? "Enter a category slug." : form.name.trim().length > 100 ? "Category name must be 100 characters or fewer." : form.description.length > 1000 ? "Description must be 1,000 characters or fewer." : !Number.isInteger(sort) || sort < 0 ? "Sort order must be a non-negative whole number." : !Number.isFinite(price) || price < 0 ? "Price floor must be a non-negative number." : "";
    setError(message);
    if (message) { reportValidation(message, { form: "category" }); return false; }
    return true;
  }

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? updateCategory(category._id, { ...form, proposal_price_floor_minor: Math.round(Number(form.proposal_price_floor || 0) * 100) }, token)
        : createCategory({ ...form, proposal_price_floor_minor: Math.round(Number(form.proposal_price_floor || 0) * 100) }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(isEdit ? "Category updated" : "Category created");
      setOpen(false);
      if (!isEdit) {
        setForm(EMPTY_FORM);
        setSlugTouched(false);
      }
    },
    onError: (err) => toast.error(err.message || "Could not save category"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            Categories power the project category filter and "Market demand" breakdown in analytics.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
              }}
              placeholder="Web development"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
              }}
              placeholder="web-development"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Shown as a hint under the category in filters (optional)"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-icon">Icon (lucide name)</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="Code2"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-sort">Sort order</Label>
              <Input
                id="cat-sort"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-price-floor">Minimum proposal price</Label>
            <Input
              id="cat-price-floor"
              type="number"
              min="0"
              step="0.01"
              value={form.proposal_price_floor}
              onChange={(e) => setForm((f) => ({ ...f, proposal_price_floor: e.target.value }))}
              placeholder="0.00 (project currency)"
            />
            <p className="text-xs text-slate-300">Applied to proposals in this category. Stored as integer minor units.</p>
          </div>
        </div>
        <DialogFooter>
          <Button
            loading={save.isPending}
            disabled={save.isPending}
            onClick={() => validate() && save.mutate()}
          >
            {isEdit ? "Save changes" : "Create category"}
          </Button>
          {error && <p className="text-xs text-brick" role="alert">{error}</p>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SkillFloorsManager() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-skills"], queryFn: () => listSkills("?all=true") });
  const skills = data?.data ?? [];
  const [drafts, setDrafts] = useState({});
  useEffect(() => {
    setDrafts((current) => Object.fromEntries(skills.map((skill) => {
      if (current[skill._id]) return [skill._id, current[skill._id]];
      const configured = skill.proposal_price_floor_minor_by_level || {};
      return [skill._id, Object.fromEntries(["beginner", "intermediate", "advanced", "expert"].map((level) => [level, String((configured[level] || 0) / 100)]))];
    })));
  }, [data]);
  const save = useMutation({
    mutationFn: ({ id, floors }) => updateSkill(id, {
      proposal_price_floor_minor_by_level: Object.fromEntries(
        Object.entries(floors).map(([level, value]) => [level, Math.round(Number(value || 0) * 100)])
      ),
    }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-skills"] });
      toast.success("Skill price floor updated");
    },
    onError: (err) => toast.error(err.message || "Could not update skill floor"),
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Skill-level proposal floors</CardTitle>
        <CardDescription>Set minimum proposal prices by skill level. Values are shown in major currency units.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Skeleton className="h-10 w-full" />}
        {skills.map((skill) => {
          const floors = drafts[skill._id] || {};
          return (
            <div key={skill._id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1.2fr_repeat(4,1fr)_auto] md:items-end">
              <div>
                <p className="font-semibold text-slate">{skill.name}</p>
                <p className="text-xs text-slate-300">{skill.category || "Uncategorized"}</p>
              </div>
              {["beginner", "intermediate", "advanced", "expert"].map((level) => (
                <label key={level} className="text-xs capitalize text-slate-300">
              {level}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={floors[level]}
                    onChange={(event) => setDrafts((current) => ({ ...current, [skill._id]: { ...floors, [level]: event.target.value } }))}
                  />
                </label>
              ))}
              <Button size="sm" loading={save.isPending} onClick={() => { const invalid = Object.values(floors).some((value) => value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)); if (invalid) { const message = "Skill floors must be non-negative numbers."; toast.error(message); reportValidation(message, { form: "skill-floor", skillId: skill._id }); return; } save.mutate({ id: skill._id, floors }); }}>Save</Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function CategoriesManager() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listCategories("?all=true"),
  });
  const categories = data?.data ?? [];

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => updateCategory(id, { is_active }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => toast.error(err.message || "Could not update category"),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteCategory(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: (err) => toast.error(err.message || "Could not delete category"),
  });

  return (
    <>
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Project categories</CardTitle>
          <CardDescription>Used in project filters and analytics demand breakdowns.</CardDescription>
        </div>
        <CategoryFormDialog
          token={token}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" /> New category
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            )}
            {!isLoading && categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-300">
                  No categories yet — create one to enable project category filters.
                </TableCell>
              </TableRow>
            )}
            {categories.map((c) => (
              <TableRow key={c._id}>
                <TableCell className="font-semibold text-slate">
                  <span className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-brass" /> {c.name}
                  </span>
                  {c.description && <p className="mt-0.5 text-xs font-normal text-slate-300">{c.description}</p>}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-300">{c.slug}</TableCell>
                <TableCell className="text-xs text-slate-300">{c.sort_order}</TableCell>
                <TableCell>
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: c._id, is_active: checked })}
                    disabled={toggleActive.isPending}
                  />
                  {!c.is_active && <Badge variant="secondary" className="ml-2">Hidden</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <CategoryFormDialog
                      token={token}
                      category={c}
                      trigger={
                        <Button size="sm" variant="secondary" className="h-8 gap-1.5">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                      }
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 gap-1.5 text-brick hover:text-brick"
                      loading={remove.isPending && remove.variables === c._id}
                      onClick={() => {
                        if (confirm(`Delete "${c.name}"? Projects already using it keep their category text.`)) {
                          remove.mutate(c._id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <SkillFloorsManager />
    </>
  );
}
