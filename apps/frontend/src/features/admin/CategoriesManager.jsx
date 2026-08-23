import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../../services/api/categories.api.js";
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

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EMPTY_FORM = { name: "", slug: "", description: "", icon: "", sort_order: 0 };

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
        }
      : EMPTY_FORM
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? updateCategory(category._id, form, token)
        : createCategory(form, token),
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
        </div>
        <DialogFooter>
          <Button
            loading={save.isPending}
            disabled={!form.name.trim() || !form.slug.trim()}
            onClick={() => save.mutate()}
          >
            {isEdit ? "Save changes" : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  );
}