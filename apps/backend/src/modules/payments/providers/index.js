import { paymentConfig } from "../../../config/payment.config.js";
import { assertPaymentProvider, PaymentProviderError } from "./payment-provider.js";
import { stripeProvider } from "./stripe.provider.js";

const providers = { stripe: stripeProvider };

const unavailableProvider = new Proxy({ name: paymentConfig.provider }, {
  get(target, property) {
    if (property === "name") return target.name;
    return () => {
      throw new PaymentProviderError(`Payment provider "${paymentConfig.provider}" is not configured`, { code: "provider_unavailable" });
    };
  },
});

export const paymentProvider = assertPaymentProvider(providers[paymentConfig.provider] || unavailableProvider);
