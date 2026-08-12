import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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

/** All contracts the signed-in user is a party to. */
export default function ContractsPage() {
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => listMyContracts(token),
    enabled: Boolean(token),
  });

  const contracts = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Contracts"
        description="Signed agreements, funded milestones, and everything currently in flight."
      />

      {isLoading && <SkeletonList count={3} />}

      {error && <ErrorState description={error.message} onRetry={refetch} />}

      {!isLoading && !error && contracts.length === 0 && (
        <EmptyState
          title="No contracts yet"
          description="Once a proposal is accepted and the first milestone is funded, the contract shows up here."
          action={
            <Link to="/projects">
              <Button>Browse projects</Button>
            </Link>
          }
        />
      )}

      {contracts.length > 0 && (
        <ul className="space-y-4">
          {contracts.map((contract) => (
            <li key={contract._id}>
              <Card as="article" className="transition-colors hover:border-brass/40">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg text-slate">
                      <Link to={`/contracts/${contract._id}`} className="hover:text-brass">
                        {contract.project_id?.title || contract.title || "Contract"}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-slate-300">
                      {formatCurrency(contract.total_amount ?? contract.amount ?? 0)} · started{" "}
                      {formatTimeAgo(contract.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={contract.status} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
