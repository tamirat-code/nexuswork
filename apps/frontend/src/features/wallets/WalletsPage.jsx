import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  getMyWallet,
  connectOnboarding,
  updateChapaPayout,
  listWalletTransactions,
  requestWithdrawal,
} from "../../services/api/wallets.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { reportValidation } from "../../lib/validation.js";
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
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [chapaDetails, setChapaDetails] = useState({ bank_code: "", account_name: "", account_number: "" });

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

  const chapaPayout = useMutation({
    mutationFn: () => updateChapaPayout(chapaDetails, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("Chapa ETB payout account saved securely.");
      setChapaDetails({ bank_code: "", account_name: "", account_number: "" });
    },
    onError: (e) => toast.error(e.message || "Could not save Chapa payout account"),
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
        eyebrow={t("wallets.eyebrow")}
        title={t("wallets.title")}
        description={t("wallets.description")}
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
                  {wallet?.payouts_enabled ? t("wallets.payoutReadyTitle") : t("wallets.payoutSetupRequiredTitle")}
                </p>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300">
                  {wallet?.payouts_enabled
                    ? t("wallets.payoutReadyDesc")
                    : t("wallets.payoutSetupRequiredDesc")}
                </p>
                {!wallet?.payouts_enabled && wallet?.requirements_due?.length > 0 && (
                  <p className="mt-1.5 text-xs text-slate-300">
                    {t("wallets.stripeNeedsItems", { count: wallet.requirements_due.length })}
                  </p>
                )}
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => connect.mutate()}
              loading={connect.isPending}
            >
              {wallet?.payouts_enabled ? t("wallets.managePayoutAccount") : t("wallets.setUpPayouts")}
            </Button>
          </div>
        </Card>
      )}

      {isStudent && (
        <Card className="mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate">{t("wallets.etbPayoutAccount")}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {t("wallets.etbPayoutDesc")}
              </p>
            </div>
            <div className="rounded-lg border border-ink-300 bg-ink-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{t("wallets.etbEarnings")}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-brass">
                {formatCurrency(wallet?.balances?.etb?.available ?? 0, "ETB")}
              </p>
              <p className="mt-1 text-xs text-slate-300">{t("wallets.etbEarningsDesc")}</p>
            </div>
            {wallet?.chapa_payout_ready && (
              <p className="text-xs text-escrow">{t("wallets.etbReady", { name: wallet.chapa_account_name, code: wallet.chapa_bank_code, last4: wallet.chapa_account_number_last4 })}</p>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              <Input label={t("wallets.bankCode")} maxLength={20} value={chapaDetails.bank_code} onChange={(e) => setChapaDetails((v) => ({ ...v, bank_code: e.target.value.replace(/\D/g, "") }))} placeholder="656" />
              <Input label={t("wallets.accountName")} maxLength={150} value={chapaDetails.account_name} onChange={(e) => setChapaDetails((v) => ({ ...v, account_name: e.target.value }))} placeholder="Full account name" />
              <Input label={t("wallets.accountNumber")} inputMode="numeric" maxLength={30} value={chapaDetails.account_number} onChange={(e) => setChapaDetails((v) => ({ ...v, account_number: e.target.value.replace(/\D/g, "") }))} placeholder="Bank account number" />
            </div>
            <Button
              size="sm"
              onClick={() => { if (!/^\d{3,20}$/.test(chapaDetails.bank_code) || chapaDetails.account_name.trim().length < 2 || chapaDetails.account_name.trim().length > 150 || !/^\d{5,30}$/.test(chapaDetails.account_number)) { const message = "Enter a valid bank code, account name, and account number."; toast.error(message); reportValidation(message, { form: "chapa-payout" }); return; } chapaPayout.mutate(); }}
              loading={chapaPayout.isPending}
              disabled={!chapaDetails.bank_code || !chapaDetails.account_name || chapaDetails.account_number.length < 5}
            >
              {t("wallets.saveEtbDetails")}
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
                  <Wallet className="h-4 w-4 text-brass" /> {t("wallets.availableBalance")}
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{t("wallets.pending")}</p>
                <p className="mt-1 font-mono text-base font-medium text-slate-300">
                  {formatCurrency(wallet?.pending ?? 0)}
                </p>
              </div>

              {isStudent && wallet?.payouts_enabled && (
                <Button
                  size="sm"
                  onClick={() => {
                    const value = Number(amount);
                    if (!Number.isFinite(value) || value <= 0 || value > Number(wallet?.available || 0)) {
                      const message = "Enter a withdrawal amount greater than zero and no more than your available balance.";
                      toast.error(message); reportValidation(message, { form: "withdrawal" });
                      return;
                    }
                    withdraw.mutate();
                  }}
                  loading={withdraw.isPending}
                >
                  {t("wallets.withdraw")}
                </Button>
              )}
            </div>

            {isStudent && wallet?.payouts_enabled && (
              <div className="mt-5 border-t border-ink-300 pt-5">
                <Input
                  label={t("wallets.withdrawalAmount")}
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
              <h2 className="font-display text-base font-semibold text-slate mb-4">{t("wallets.transactionHistory")}</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink-300 text-slate-300">
                      <th className="pb-2.5 font-semibold">{t("wallets.type")}</th>
                      <th className="pb-2.5 font-semibold">{t("wallets.transactionDesc")}</th>
                      <th className="pb-2.5 font-semibold">{t("wallets.status")}</th>
                      <th className="pb-2.5 text-right font-semibold">{t("wallets.amount")}</th>
                      <th className="pb-2.5 text-right font-semibold">{t("wallets.date")}</th>
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
                          {t("wallets.noTransactions")}
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
                <span>{t("wallets.escrowNotice")}</span>
              </p>
              <p className="flex items-start gap-2">
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-brick" />
                <span>{t("wallets.withdrawalNotice")}</span>
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

