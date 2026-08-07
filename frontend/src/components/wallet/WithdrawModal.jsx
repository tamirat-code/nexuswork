import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { WITHDRAW_METHODS } from "../../data/wallet";
import { useNotifications } from "../../context/NotificationContext";

export default function WithdrawModal({ open, onClose, availableBalance }) {
  const { notify } = useNotifications();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const feePercent = method ? parseFloat(method.fee) || 0 : 0;
  const fee = method?.fee === "$5 flat" ? 5 : (numAmount * feePercent) / 100;
  const receive = numAmount - fee;
  const isValid = numAmount >= (method?.min || 0) && numAmount <= availableBalance;

  const reset = () => {
    setStep(1);
    setMethod(null);
    setAmount("");
    setProcessing(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    if (!isValid) {
      notify("Invalid amount or below minimum.", "error");
      return;
    }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1800));
    setStep(3);
    notify(`$${numAmount.toFixed(2)} withdrawal initiated via ${method.name}`, "success");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {step === 1 && "Choose Method"}
                {step === 2 && "Enter Amount"}
                {step === 3 && "Withdrawal Initiated"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Step {Math.min(step, 2)} of 2</p>
            </div>
            <button onClick={handleClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Step 1: Choose Method */}
          {step === 1 && (
            <div className="space-y-2 p-6">
              {WITHDRAW_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m); setStep(2); }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-blue-400 hover:bg-blue-50/50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{m.name}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">Fee: {m.fee} · Min: ${m.min} · {m.eta}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Enter Amount */}
          {step === 2 && method && (
            <div className="p-6">
              <div className="mb-6 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-xs text-slate-500 dark:text-zinc-400">Available Balance</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">${availableBalance.toFixed(2)}</p>
              </div>

              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">Amount to withdraw</label>
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-20 text-lg font-bold outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
                <button
                  onClick={() => setAmount(availableBalance.toString())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300"
                >
                  MAX
                </button>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Method</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-200">{method.icon} {method.name}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Fee ({method.fee})</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-200">-${fee.toFixed(2)}</span>
                </div>
                <div className="my-2 border-t border-slate-200 dark:border-white/10" />
                <div className="flex justify-between text-base">
                  <span className="font-bold text-slate-900 dark:text-white">You receive</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">${receive.toFixed(2)}</span>
                </div>
              </div>

              {numAmount > 0 && numAmount < method.min && (
                <p className="mt-3 text-xs text-red-500">Minimum withdrawal is ${method.min}</p>
              )}
              {numAmount > availableBalance && (
                <p className="mt-3 text-xs text-red-500">Insufficient balance</p>
              )}

              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isValid || processing}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : `Withdraw $${numAmount.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10"
              >
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Withdrawal Initiated!</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                ${numAmount.toFixed(2)} is being processed via {method.name}. You'll receive ${receive.toFixed(2)} in {method.eta}.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}