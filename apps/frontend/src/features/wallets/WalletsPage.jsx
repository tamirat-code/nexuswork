import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  getMyWallet,
  connectOnboarding,
  listWalletTransactions,
  requestWithdrawal,
} from "../../services/api/wallets.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import {
  Card,
  Button,
  Input,
  Badge,
  PageHeader,
  Skeleton,
} from "../../components/ui/index.js";

const TONE = {
  deposit: "text-escrow",
  withdrawal: "text-brick",
  payout: "text-brass",
};

const WITHDRAWAL_STATUS = {
  pending: { label: "Pending", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
};

export default function WalletsPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");

  const { data: wData, isLoading: wLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getMyWallet(token),
    enabled: !!token,
  });

  const { data: tData, isLoading: tLoading } = useQuery({
    queryKey: ["wallet-tx"],
    queryFn: () => listWalletTransactions(token),
    enabled: !!token && user?.role === "student",
  });

  const wallet = wData?.data;
  const txs = tData?.data ?? [];
  const isStudent = user?.role === "student";

  const connect = useMutation({
    mutationFn: () => connectOnboarding(token),
    onSuccess: (res) => {
      const url = res?.data?.onboarding_url;
      if (!url) {
        toast.error("Stripe did not return an onboarding link.");
        return;
      }
      if (res.data.already_complete) {
        qc.invalidateQueries({ queryKey: ["wallet"] });
        qc.invalidateQueries({ queryKey: ["wallet-tx"] });
        toast.success("Your payout account is already set up — opening your Stripe dashboard in a new tab.");
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      window.location.assign(url);
    },
    onError: (e) => toast.error(e.message || "Could not start Stripe payout setup"),
  });

  const withdraw = useMutation({
    mutationFn: () => requestWithdrawal({ amount: Number(amount) }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-tx"] });
      toast.success("Withdrawal requested");
      setAmount("");
    },
    onError: (e) => toast.error(e.message || "Could not request withdrawal"),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectState = params.get("connect");
    if (connectState === "done") {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-tx"] });
      toast.success("Stripe payout setup completed. Your account is being checked.");
      window.history.replaceState({}, "", "/wallet");
    }
    if (connectState === "refresh") {
      toast.message("Stripe payout setup was not completed. You can continue setup below.");
      window.history.replaceState({}, "", "/wallet");
    }
  }, [qc]);

  return (
    <div className="w-full animate-fade-up">
      <PageHeader
        eyebrow="Money"
        title="Wallet"
        description="Track available balance, pending escrow, and milestone payouts."
      />

      {isStudent && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-5 p-1">
            <div className="flex items-start gap-3">
              {wallet?.payouts_enabled ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-escrow" />
              ) : (
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brass" />
              )}

              <div>
                <p className="text-sm font-semibold text-slate">
                  {wallet?.payouts_enabled ? "Payout account ready" : "Payout setup required"}
                </p>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300">
                  {wallet?.payouts_enabled
                    ? "Your Stripe Connect account can receive milestone payouts."
                    : "Complete Stripe Connect verification so NexusWork can release your approved milestone earnings to you."}
                </p>
                {!wallet?.payouts_enabled && wallet?.requirements_due?.length > 0 && (
                  <p className="mt-1.5 text-xs text-slate-300">
                    Stripe still needs {wallet.requirements_due.length} item(s) from you.
                  </p>
                )}
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => connect.mutate()}
              loading={connect.isPending}
            >
              {wallet?.payouts_enabled ? "Manage payout account" : "Set up payouts"}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4 p-1">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  <Wallet className="h-4 w-4 text-brass" /> Available balance
                </p>
                {wLoading ? (
                  <Skeleton className="mt-2 h-9 w-36" />
                ) : (
                  <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-brass">
                    {formatCurrency(wallet?.available ?? 0)}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Pending</p>
                <p className="mt-1 font-mono text-base font-medium text-slate-300">
                  {formatCurrency(wallet?.pending ?? 0)}
                </p>
              </div>

              {isStudent && wallet?.payouts_enabled && (
                <Button
                  size="sm"
                  onClick={() => {
                    const value = Number(amount);
                    if (!value || value <= 0) {
                      toast.error("Enter a valid withdrawal amount.");
                      return;
                    }
                    withdraw.mutate();
                  }}
                  loading={withdraw.isPending}
                >
                  Withdraw
                </Button>
              )}
            </div>

            {isStudent && wallet?.payouts_enabled && (
              <div className="mt-5 border-t border-ink-300 pt-5">
                <Input
                  label="Withdrawal amount ($)"
                  id="wd-amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="max-w-xs font-mono"
                  placeholder="250"
                />
              </div>
            )}
          </Card>

          {isStudent && (
            <Card>
              <h2 className="font-display text-base font-semibold text-slate mb-4">Transaction history</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink-300 text-slate-300">
                      <th className="pb-2.5 font-semibold">Type</th>
                      <th className="pb-2.5 font-semibold">Description</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                      <th className="pb-2.5 text-right font-semibold">Amount</th>
                      <th className="pb-2.5 text-right font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-300">
                    {tLoading &&
                      [...Array(3)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} className="py-3">
                            <Skeleton className="h-6 w-full" />
                          </td>
                        </tr>
                      ))}

                    {!tLoading && txs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-300">
                          No transactions yet.
                        </td>
                      </tr>
                    )}

                    {txs.map((tx) => (
                      <tr key={tx._id} className="hover:bg-ink-50/50">
                        <td className="py-3 capitalize text-slate">{tx.type}</td>
                        <td className="py-3 text-slate-300">{tx.description || "—"}</td>
                        <td className="py-3">
                          {tx.type === "withdrawal" && tx.status ? (
                            <Badge tone={WITHDRAWAL_STATUS[tx.status]?.tone || "neutral"} size="sm">
                              {WITHDRAWAL_STATUS[tx.status]?.label || tx.status}
                            </Badge>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className={`py-3 text-right font-mono font-medium ${TONE[tx.type] || "text-slate-300"}`}>
                          {tx.type === "deposit" ? "+" : tx.type === "withdrawal" ? "−" : ""}
                          {formatCurrency(Math.abs(tx.amount ?? 0))}
                        </td>
                        <td className="py-3 text-right font-mono text-[11px] text-slate-300">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p className="flex items-start gap-2">
                <ArrowDownLeft className="mt-0.5 h-4 w-4 shrink-0 text-escrow" />
                <span>Milestone payments are released here after client approval.</span>
              </p>
              <p className="flex items-start gap-2">
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-brick" />
                <span>Withdrawals require a verified Stripe payout account.</span>
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
