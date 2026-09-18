import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, FileText, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPortfolioItem } from "../../services/api/portfolios.api.js";
import { openFilePreview } from "../../services/api/files.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatDate } from "../../utils/date.utils.js";
import { toast } from "sonner";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";

export default function PortfolioDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ["portfolio-item", id],
    queryFn: () => getPortfolioItem(id),
    enabled: Boolean(id),
  });
  const item = data?.data;

  async function viewAttachedWork() {
    if (!item?.file_id) return;
    try {
      await openFilePreview(item.file_id, token);
    } catch (previewError) {
      toast.error(previewError.message || "Could not open the attached work");
    }
  }

  if (isLoading) return <div className="mx-auto max-w-4xl space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-80 w-full" /><Skeleton className="h-32 w-full" /></div>;
  if (error || !item) return <Card className="mx-auto max-w-xl p-8 text-center"><h1 className="font-display text-xl text-content-primary">{t("portfolios.itemNotFound", { defaultValue: "Portfolio work not found" })}</h1><p className="mt-2 text-sm text-content-secondary">{error?.message || "This portfolio item may have been removed or is no longer public."}</p><Link to="/portfolios" className="mt-6 inline-block"><Button variant="secondary">{t("portfolios.backToPortfolio", { defaultValue: "Back to portfolio" })}</Button></Link></Card>;

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-up">
      <Link to="/portfolios" className="inline-flex items-center gap-2 text-sm text-content-secondary hover:text-brand"><ArrowLeft className="h-4 w-4" /> {t("portfolios.backToPortfolio", { defaultValue: "Back to portfolio" })}</Link>
      <Card className="mt-5 overflow-hidden">
        {(item.image_url || item.thumbnail_url) && <img src={item.image_url || item.thumbnail_url} alt={item.title} className="max-h-[520px] w-full object-cover" />}
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{t("portfolios.workShowcase", { defaultValue: "Work showcase" })}</p>
              <h1 className="mt-2 font-display text-3xl tracking-tight text-content-primary">{item.title}</h1>
              <p className="mt-2 text-xs text-content-muted">{formatDate(item.createdAt)}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-brand" />
          </div>
          {item.description && <p className="mt-6 whitespace-pre-line text-base leading-7 text-content-secondary">{item.description}</p>}
          {item.tags?.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{item.tags.map((tag) => <span key={tag} className="rounded-full border border-border-subtle px-3 py-1 text-xs text-content-secondary">{tag}</span>)}</div>}
          <div className="mt-8 flex flex-wrap gap-3">
            {item.project_url && <a href={item.project_url} target="_blank" rel="noreferrer"><Button><ExternalLink className="h-4 w-4" /> {t("portfolios.viewProject", { defaultValue: "View live project" })}</Button></a>}
            {item.file_id && <Button variant="secondary" onClick={viewAttachedWork}><FileText className="h-4 w-4" /> {t("portfolios.viewAttachedWork", { defaultValue: "View attached work" })}</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
