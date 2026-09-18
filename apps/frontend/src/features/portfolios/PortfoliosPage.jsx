import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FolderOpen, Plus, Sparkles, Trash2 } from "lucide-react";
import { getMyPortfolio, deletePortfolioEntry, createPortfolioEntry } from "../../services/api/portfolios.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/shadcn/dialog.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog.jsx";
import { reportValidation, validHttpUrl } from "../../lib/validation.js";

export default function PortfoliosPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [removeTarget, setRemoveTarget] = useState(null);

  function validate() {
    const next = {};
    if (!title.trim()) next.title = "Enter a portfolio title.";
    else if (title.trim().length > 200) next.title = "Title must be 200 characters or fewer.";
    if (description.trim().length > 2000) next.description = "Description must be 2,000 characters or fewer.";
    if (url.trim() && (url.trim().length > 500 || !validHttpUrl(url))) next.url = "Enter a valid http:// or https:// URL.";
    if (videoUrl.trim() && (videoUrl.trim().length > 500 || !validHttpUrl(videoUrl))) next.videoUrl = "Enter a valid video URL.";
    if (imageUrl.trim() && (imageUrl.trim().length > 500 || !validHttpUrl(imageUrl))) next.imageUrl = "Enter a valid screenshot URL.";
    setErrors(next);
    if (Object.keys(next).length) { reportValidation("Portfolio form contains invalid fields", { form: "portfolio-entry", fields: Object.keys(next) }); return false; }
    return true;
  }

  const { data, isLoading } = useQuery({ queryKey: ["portfolio"], queryFn: () => getMyPortfolio(token), enabled: !!token });
  const entries = data?.data ?? [];

  const create = useMutation({
    mutationFn: () => createPortfolioEntry({ title, description, url, video_url: videoUrl, image_url: imageUrl }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio"] }); setTitle(""); setDescription(""); setUrl(""); setVideoUrl(""); setImageUrl(""); setErrors({}); toast.success("Added to portfolio"); },
    onError: (err) => toast.error(err.message || "Could not add entry"),
  });
  const remove = useMutation({
    mutationFn: (id) => deletePortfolioEntry(id, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio"] }); toast.success("Removed entry"); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;

  return (
    <div className="w-full animate-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{t("portfolios.eyebrow")}</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-content-primary">{t("portfolios.title")}</h1>
          <p className="mt-2 text-sm text-content-secondary">{t("portfolios.subtitle")}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> {t("portfolios.addEntry")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("portfolios.addEntryTitle")}</DialogTitle><DialogDescription>{t("portfolios.addEntryDesc")}</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="pf-title">{t("portfolios.entryTitle")}</Label><Input id="pf-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g. Campus club website" />{errors.title && <p className="text-xs text-brick" role="alert">{errors.title}</p>}</div>
              <div className="space-y-1.5"><Label htmlFor="pf-desc">{t("portfolios.entryDesc")}</Label><Input id="pf-desc" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What you built and the impact" />{errors.description && <p className="text-xs text-brick" role="alert">{errors.description}</p>}</div>
              <div className="space-y-1.5"><Label htmlFor="pf-url">{t("portfolios.projectUrl")}</Label><Input id="pf-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />{errors.url && <p className="text-xs text-brick" role="alert">{errors.url}</p>}</div>
              <div className="space-y-1.5"><Label htmlFor="pf-video">{t("portfolios.videoUrl", { defaultValue: "Video URL (optional)" })}</Label><Input id="pf-video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo, or .mp4 URL" />{errors.videoUrl && <p className="text-xs text-brick" role="alert">{errors.videoUrl}</p>}</div>
              <div className="space-y-1.5"><Label htmlFor="pf-image">{t("portfolios.screenshotUrl", { defaultValue: "Screenshot/image URL (optional)" })}</Label><Input id="pf-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/screenshot.png" />{errors.imageUrl && <p className="text-xs text-brick" role="alert">{errors.imageUrl}</p>}</div>
            </div>
            <DialogFooter><Button size="sm" loading={create.isPending} onClick={() => validate() && create.mutate()}>{t("portfolios.addToPortfolio")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {entries.length === 0 && (
        <Card className="mt-8 p-14 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-brand" />
          <h3 className="mt-4 font-display text-lg text-content-primary">{t("portfolios.emptyTitle")}</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-content-secondary">{t("portfolios.emptyDesc")}</p>
        </Card>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((e) => (
          <Card key={e._id} className="group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <FolderOpen className="h-8 w-8 text-brand" />
                <Button variant="ghost" size="sm" className="h-8 w-8 text-brick opacity-0 transition-opacity group-hover:opacity-100" onClick={() => setRemoveTarget(e)} aria-label="Remove entry"><Trash2 className="h-4 w-4" /></Button>
              </div>
              <Link to={`/portfolios/${e._id}`} className="mt-3 block font-display text-base text-content-primary hover:text-brand">{e.title}</Link>
              <p className="mt-1 line-clamp-3 text-sm text-content-secondary">{e.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {e.milestone_id && <Badge variant="secondary" className="text-xs">{t("portfolios.milestoneBadge")}</Badge>}
                {e.consent_status === "pending" && <Badge variant="outline" className="text-xs">{t("portfolios.awaitingConsentBadge")}</Badge>}
                {e.consent_status === "denied" && <Badge variant="outline" className="text-xs">{t("portfolios.privateBadge")}</Badge>}
                {e.consent_status === "approved" && <Badge variant="secondary" className="text-xs">{t("portfolios.publishedBadge")}</Badge>}
              </div>
              <Link to={`/portfolios/${e._id}`} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">{t("portfolios.viewProject", { defaultValue: "View work" })}</Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <ConfirmDialog open={Boolean(removeTarget)} title={t("portfolios.removeEntryTitle")} description={t("portfolios.removeEntryDesc")} confirmLabel={t("portfolios.removeBtn")} tone="danger" loading={remove.isPending} onCancel={() => setRemoveTarget(null)} onConfirm={() => { remove.mutate(removeTarget._id); setRemoveTarget(null); }} />
    </div>
  );
}
