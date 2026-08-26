import { paymentConfig } from "../../../config/payment.config.js";
import { assertPaymentProvider, PaymentProviderError } from "./payment-provider.js";
import { stripeProvider } from "./stripe.provider.js";
import { chapaProvider } from "./chapa.provider.js";

const providers = { stripe: stripeProvider, chapa: chapaProvider };

export function getPaymentProvider(name = paymentConfig.provider) {
  const providerName = String(name || "").toLowerCase();
  const provider = providers[providerName];
  if (provider) return assertPaymentProvider(provider);

  const unavailableProvider = new Proxy({ name: providerName }, {
    get(target, property) {
      if (property === "name") return target.name;
      return () => {
        throw new PaymentProviderError(`Payment provider "${providerName}" is not configured`, { code: "provider_unavailable" });
      };
    },
  });
  return assertPaymentProvider(unavailableProvider);
}

export const paymentProvider = getPaymentProvider();
