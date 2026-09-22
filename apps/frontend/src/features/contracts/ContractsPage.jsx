import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listMyContracts } from "../../services/api/contracts.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonList,
  StatusBadge,
} from "../../components/ui/index.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatTimeAgo } from "../../utils/date.utils.js";
import { getContractsOverview } from "../../services/api/oversight.api.js";

/** All contracts the signed-in user is a party to. */
export default function ContractsPage() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => listMyContracts(token),
    enabled: Boolean(token),
  });

  const contracts = data?.data ?? [];
  const overview = useQuery({
    queryKey: ["contracts-overview"],
    queryFn: () => getContractsOverview(token),
    enabled: Boolean(token && ["client", "admin"].includes(user?.role)),
  });

  return (
    <>
      <PageHeader
        title={t("contracts.title")}
        description={t("contracts.description")}
      />

      {isLoading && <SkeletonList count={3} />}

      {error && <ErrorState description={error.message} onRetry={refetch} />}

      {!isLoading && !error && contracts.length === 0 && (
        <EmptyState
          title={t("contracts.noContracts")}
          description={t("contracts.noContractsDesc")}
          action={
            <Link to="/projects">
              <Button>{t("contracts.browseProjects")}</Button>
            </Link>
          }
        />
      )}

      {contracts.length > 0 && (
        <ul className="space-y-4">
          {contracts.map((contract) => {
            const title = contract.project_id?.title || contract.title || t("contracts.contractTitle");
            const amount =
              contract.total_amount ??
              contract.amount ??
              contract.terms?.total_amount ??
              0;

            return (
              <li key={contract._id}>
                  <Card
                    as={Link}
                    to={`/contracts/${contract._id}`}
                  aria-label={`Open contract ${title}`}
                  className="block cursor-pointer transition-colors hover:border-brass/50 hover:bg-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-display text-lg text-slate transition-colors hover:text-brass">
                        {title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-300">
                        {formatCurrency(amount, contract.terms?.currency || "USD")} · {t("contracts.started")} {formatTimeAgo(contract.createdAt)}
                      </p>
                      {contract.status === "pending_review" && (
                        <p className="mt-2 text-xs font-medium text-brass">
                          {t("contracts.reviewAndSign")}
                        </p>
                      )}
                      {contract.status === "pending_signature" && (
                        <p className="mt-2 text-xs font-medium text-brass">
                          {t("contracts.reviewSignatureStatus")}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={contract.status} />
                  </div>
                  </Card>
                <Link className="mt-2 inline-block text-sm font-semibold text-brand" to={`/contracts/${contract._id}/evidence`}>{t("contracts.viewEvidence", { defaultValue: "View work evidence" })}</Link>
              </li>
            );
          })}
        </ul>
      )}

      {overview.data?.data?.length > 0 && <Card className="mt-6 border-brand/30 bg-brand-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-display text-lg text-content-primary">{t("contracts.oversightTitle", { defaultValue: "Cross-contract oversight" })}</h2><p className="text-sm text-content-secondary">{t("contracts.oversightHint", { defaultValue: "All contracts, milestone funding, and delivery status in one view." })}</p></div>
          <div className="flex gap-4 text-sm"><span><strong>{overview.data.data.length}</strong> {t("contracts.contracts", { defaultValue: "contracts" })}</span><span><strong>{overview.data.data.reduce((sum, item) => sum + (item.oversight?.at_risk_milestones || 0), 0)}</strong> {t("contracts.atRisk", { defaultValue: "at risk" })}</span></div>
        </div>
      </Card>}
    </>
  );
}
