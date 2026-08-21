import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stripePromise } from "../../lib/stripeClient.js";
import { confirmMilestoneFunding } from "../../services/api/milestones.api.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/shadcn/dialog.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { formatCurrency } from "../../utils/currency.utils.js";

function CardForm({ contractId, milestone, token, onDone }) {
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
          {busy ? "Processing…" : `Pay ${formatCurrency(milestone.amount)} into escrow`}
        </Button>
      </DialogFooter>
    </form>
  );
}


export default function FundMilestoneDialog({ contractId, funding, token, onClose }) {
  const open = Boolean(funding?.clientSecret);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund milestone</DialogTitle>
          <DialogDescription>
            {funding?.milestone
              ? `${formatCurrency(funding.milestone.amount)} will be held in escrow until you approve "${funding.milestone.title}".`
              : "Enter your card details to fund this milestone."}
          </DialogDescription>
        </DialogHeader>

        {open && (
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