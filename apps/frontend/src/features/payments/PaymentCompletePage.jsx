import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmMilestoneFunding } from "../../services/api/milestones.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";

export default function PaymentCompletePage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState("checking");
  const [attempt, setAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [storedReference] = useState(() => (
    typeof window !== "undefined"
      ? window.localStorage.getItem("nexuswork:chapa-payment-reference")
      : null
  ));
  const paymentReference = params.get("tx_ref") || params.get("trx_ref") || storedReference;

  const confirmMutation = useMutation({
    mutationFn: (reference) => confirmMilestoneFunding(reference, token),
  });

  useEffect(() => {
    if (!paymentReference || !token) {
      setState("pending");
      return;
    }
    let stopped = false;
    let attempts = 0;
    let timer;

    async function verify() {
      attempts += 1;
      setAttempt(attempts);
      try {
        await confirmMutation.mutateAsync(paymentReference);
        if (stopped) return;
        queryClient.invalidateQueries({ queryKey: ["milestones"] });
        queryClient.invalidateQueries({ queryKey: ["payments"] });
        window.localStorage.removeItem("nexuswork:chapa-payment-reference");
        setState("confirmed");
      } catch (error) {
        if (stopped) return;
        const message = error?.message || "Payment verification is still pending.";
        if (/failed|cancelled|canceled/i.test(message)) {
          window.localStorage.removeItem("nexuswork:chapa-payment-reference");
          setErrorMessage(message);
          setState("failed");
        } else if (attempts < 15) {
          timer = window.setTimeout(verify, 2000);
        } else {
          setErrorMessage("Chapa has not returned a final status yet. You can check again from your contract.");
          setState("pending");
        }
      }
    }

    verify();
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentReference, token, queryClient]);

  const confirmed = state === "confirmed";
  const failed = state === "failed";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center py-12">
      <Card className="w-full border-brass/30">
        <CardContent className="p-8 text-center sm:p-12">
          {confirmed ? (
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
          ) : failed ? (
            <Clock3 className="mx-auto h-14 w-14 text-red-400" />
          ) : (
            <Loader2 className="mx-auto h-14 w-14 animate-spin text-brass" />
          )}
          <h1 className="mt-5 font-display text-3xl text-slate">
            {confirmed ? t("payments.confirmedTitle") : failed ? t("payments.failedTitle") : state === "checking" ? t("payments.checkingTitle") : t("payments.pendingTitle")}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
            {confirmed
              ? t("payments.confirmedDesc")
              : failed
                ? errorMessage || t("payments.failedTitle")
              : state === "checking"
                ? t("payments.checkingDesc", { attempt })
                : errorMessage || t("payments.pendingDesc")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-brass" /> {t("payments.providerVerificationNotice")}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contracts"><Button>{t("payments.viewContracts")}</Button></Link>
            <Link to="/payments"><Button variant="secondary">{t("payments.viewPayments")}</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

