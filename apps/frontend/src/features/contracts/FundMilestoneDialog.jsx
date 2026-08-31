import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stripePromise } from "../../lib/stripeClient.js";
import { confirmMilestoneFunding } from "../../services/api/milestones.api.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/shadcn/dialog.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { formatCurrency } from "../../utils/currency.utils.js";

function CardForm({ contractId, milestone, token, onDone }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [stripeError, setStripeError] = useState(null);

  const confirmOnServer = useMutation({
    mutationFn: (paymentIntentId) => confirmMilestoneFunding(paymentIntentId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", contractId] });
      toast.success("Milestone funded — funds are held in escrow.");
      onDone();
    },
    onError: (err) => {
      toast.error(
        err.message ||
          "Payment went through, but we couldn't confirm it immediately. It should update shortly — refresh in a moment."
      );
      onDone();
    },
  });

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setStripeError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setStripeError(error.message || "Your card couldn't be processed. Please check the details and try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      confirmOnServer.mutate(paymentIntent.id);
      return;
    }

    setStripeError(`Payment status: ${paymentIntent?.status || "unknown"}. Please try again.`);
    setSubmitting(false);
  }

  const busy = submitting || confirmOnServer.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {stripeError && (
        <p className="text-sm text-red-400" role="alert">
          {stripeError}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={!stripe || busy} className="w-full sm:w-auto">
          {busy ? t("contracts.preparingPayment") : `${t("contracts.fundMilestone")} (${formatCurrency(milestone?.amount ?? 0, milestone?.currency || "USD")})`}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ChapaCheckout({ contractId, milestone, paymentIntentId, checkoutUrl, token, onDone }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(false);

  async function checkPayment() {
    setChecking(true);
    try {
      await confirmMilestoneFunding(paymentIntentId, token);
      queryClient.invalidateQueries({ queryKey: ["milestones", contractId] });
      toast.success("Milestone funded — funds are held in escrow.");
      onDone();
    } catch (error) {
      toast.info(error.message || "Payment is still pending. Complete checkout, then check again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
        <p className="font-semibold text-white">Continue securely with Chapa</p>
        <p className="mt-1 text-slate-300">Your payment will be verified before the milestone is marked funded.</p>
      </div>
      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={checkPayment} disabled={checking || !paymentIntentId}>
          {checking ? "Checking…" : "I’ve completed payment"}
        </Button>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            if (paymentIntentId) {
              window.localStorage.setItem("nexuswork:chapa-payment-reference", paymentIntentId);
            }
            window.location.assign(checkoutUrl);
          }}
          disabled={!checkoutUrl}
        >
          {t("contracts.continuePayment")}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function FundMilestoneDialog({ contractId, funding, token, onClose }) {
  const { t } = useTranslation();
  const open = Boolean(funding?.clientSecret);
  const provider = funding?.provider || "stripe";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("contracts.fundMilestone")}</DialogTitle>
          <DialogDescription>
            {funding?.milestone
              ? `${formatCurrency(funding.milestone.amount, funding.milestone.currency || "USD")} will be held in escrow until you approve "${funding.milestone.title}".`
              : t("contracts.fundMilestone")}
          </DialogDescription>
        </DialogHeader>

        {open && provider === "chapa" && (
          <ChapaCheckout
            contractId={contractId}
            milestone={funding.milestone}
            paymentIntentId={funding.paymentIntentId}
            checkoutUrl={funding.clientSecret}
            token={token}
            onDone={onClose}
          />
        )}

        {open && provider === "stripe" && (
          <Elements
            key={funding.clientSecret}
            stripe={stripePromise}
            options={{ clientSecret: funding.clientSecret, appearance: { theme: "night" } }}
          >
            <CardForm contractId={contractId} milestone={funding.milestone} token={token} onDone={onClose} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}

