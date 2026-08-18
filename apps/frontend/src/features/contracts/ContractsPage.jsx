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
          {contracts.map((contract) => {
            const title = contract.project_id?.title || contract.title || "Contract";
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
                        {formatCurrency(amount)} · started {formatTimeAgo(contract.createdAt)}
                      </p>
                      {contract.status === "pending_review" && (
                        <p className="mt-2 text-xs font-medium text-brass">
                          Click to review and sign this contract
                        </p>
                      )}
                      {contract.status === "pending_signature" && (
                        <p className="mt-2 text-xs font-medium text-brass">
                          Click to review your signature status
                        </p>
                      )}
                    </div>
                    <StatusBadge status={contract.status} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}