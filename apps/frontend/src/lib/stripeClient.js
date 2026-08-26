import { loadStripe } from "@stripe/stripe-js";


const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Do not initialize Stripe.js when the active checkout is Chapa or no Stripe
// publishable key is configured. This avoids irrelevant HTTPS/key warnings on
// the hosted Chapa payment path.
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
