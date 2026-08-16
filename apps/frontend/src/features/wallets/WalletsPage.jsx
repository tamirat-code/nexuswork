import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { getMyWallet, listWalletTransactions, requestWithdrawal } from "../../services/api/wallets.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/shadcn/dialog.jsx";

const TONE = { deposit: "text-escrow", withdrawal: "text-brick", payout: "text-brass" };

export default function WalletsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const { data: wData, isLoading: wLoading } = useQuery({ queryKey: ["wallet"], queryFn: () => getMyWallet(token), enabled: !!token });
  const { data: tData, isLoading: tLoading } = useQuery({ queryKey: ["wallet-tx"], queryFn: () => listWalletTransactions(token), enabled: !!token });
  const wallet = wData?.data;
  const txs = tData?.data ?? [];

  const withdraw = useMutation({
    mutationFn: () => requestWithdrawal({ amount: Number(amount) }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallet"] }); qc.invalidateQueries({ queryKey: ["wallet-tx"] }); toast.success("Withdrawal requested"); setAmount(""); },
    onError: (e) => toast.error(e.message || "Could not request withdrawal"),
  });

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Money</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Wallet</h1>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300"><Wallet className="h-4 w-4 text-brass" /> Available balance</p>
                {wLoading ? <Skeleton className="mt-2 h-10 w-40" /> : <p className="mt-1 font-mono text-4xl font-semibold text-brass">{formatCurrency(wallet?.available_balance ?? 0)}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Pending</p>
                <p className="mt-1 font-mono text-lg text-slate-300">{formatCurrency(wallet?.pending_balance ?? 0)}</p>
              </div>
              <Dialog>
                <DialogTrigger asChild><Button>Withdraw</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Withdraw funds</DialogTitle><DialogDescription>Funds transfer to your linked payout method within 2–3 days.</DialogDescription></DialogHeader>
                  <div className="space-y-1.5"><label htmlFor="wd-amount" className="text-sm font-semibold text-slate">Amount (USD)</label><Input id="wd-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono" placeholder="250" /></div>
                  <DialogFooter><Button loading={withdraw.isPending} onClick={() => withdraw.mutate()}>Request withdrawal</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Transaction history</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Date</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {tLoading && [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)}
                  {!tLoading && txs.length === 0 && <TableRow><TableCell colSpan={4} className="py-10 text-center text-slate-300">No transactions yet — funded milestones appear here.</TableCell></TableRow>}
                  {txs.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell className="text-sm capitalize text-slate-300">{tx.type}</TableCell>
                      <TableCell className="text-sm text-slate-300">{tx.description || "—"}</TableCell>
                      <TableCell className={`text-right font-mono ${TONE[tx.type] || "text-slate-300"}`}>{tx.type === "deposit" ? "+" : tx.type === "withdrawal" || tx.type === "fee" ? "−" : ""}{formatCurrency(Math.abs(tx.amount ?? 0))}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-300">{formatDate(tx.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5 text-sm text-slate-300 space-y-2">
              <p className="flex gap-2"><ArrowDownLeft className="mt-0.5 h-4 w-4 text-escrow" /> Milestone payments land here after client approval.</p>
              <p className="flex gap-2"><ArrowUpRight className="mt-0.5 h-4 w-4 text-brick" /> Withdrawals move funds to your connected bank/Stripe account.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
