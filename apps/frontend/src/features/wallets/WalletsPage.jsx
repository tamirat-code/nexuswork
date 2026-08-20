import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  getMyWallet,
  getPayoutStatus,
  connectOnboarding,
  listWalletTransactions,
  requestWithdrawal,
} from "../../services/api/wallets.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";

const TONE = {
  deposit: "text-escrow",
  withdrawal: "text-brick",
  payout: "text-brass",
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
    <div className="mx-auto max-w-6xl animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Money</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Wallet</h1>
      </header>

      {isStudent && (
        <Card className="mt-6">
          <CardContent className="flex flex-wrap items-center justify-between gap-5 p-6">
            <div className="flex items-start gap-3">
              {wallet?.payouts_enabled ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-escrow" />
              ) : (
                <ShieldAlert className="mt-0.5 h-5 w-5 text-brass" />
              )}

              <div>
                <p className="font-semibold text-slate">
                  {wallet?.payouts_enabled ? "Payout account ready" : "Payout setup required"}
                </p>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  {wallet?.payouts_enabled
                    ? "Your Stripe Connect account can receive milestone payouts."
                    : "Complete Stripe Connect verification so NexusWork can release your approved milestone earnings to you."}
                </p>
                {!wallet?.payouts_enabled && wallet?.requirements_due?.length > 0 && (
                  <p className="mt-2 text-xs text-slate-300">
                    Stripe still needs {wallet.requirements_due.length} item(s) from you.
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={() => connect.mutate()}
              loading={connect.isPending}
            >
              {wallet?.payouts_enabled ? "Manage payout account" : "Set up payouts"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <Wallet className="h-4 w-4 text-brass" /> Available balance
                </p>
                {wLoading ? (
                  <Skeleton className="mt-2 h-10 w-40" />
                ) : (
                  <p className="mt-1 font-mono text-4xl font-semibold text-brass">
                    {formatCurrency(wallet?.available ?? 0)}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Pending</p>
                <p className="mt-1 font-mono text-lg text-slate-300">
                  {formatCurrency(wallet?.pending ?? 0)}
                </p>
              </div>

              {isStudent && wallet?.payouts_enabled && (
                <Button
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
            </CardContent>

            {isStudent && wallet?.payouts_enabled && (
              <CardContent className="border-t border-ink-300 p-6">
                <label htmlFor="wd-amount" className="text-sm font-semibold text-slate">
                  Withdrawal amount
                </label>
                <Input
                  id="wd-amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 max-w-sm font-mono"
                  placeholder="250"
                />
              </CardContent>
            )}
          </Card>

          {isStudent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction history</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tLoading &&
                      [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={4}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}

                    {!tLoading && txs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-slate-300">
                          No transactions yet.
                        </TableCell>
                      </TableRow>
                    )}

                    {txs.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell className="text-sm capitalize text-slate-300">{tx.type}</TableCell>
                        <TableCell className="text-sm text-slate-300">{tx.description || "—"}</TableCell>
                        <TableCell className={`text-right font-mono ${TONE[tx.type] || "text-slate-300"}`}>
                          {tx.type === "deposit" ? "+" : tx.type === "withdrawal" ? "−" : ""}
                          {formatCurrency(Math.abs(tx.amount ?? 0))}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-300">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-2 p-5 text-sm text-slate-300">
              <p className="flex gap-2">
                <ArrowDownLeft className="mt-0.5 h-4 w-4 text-escrow" />
                Milestone payments are released here after client approval.
              </p>
              <p className="flex gap-2">
                <ArrowUpRight className="mt-0.5 h-4 w-4 text-brick" />
                Withdrawals require a verified Stripe payout account.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}