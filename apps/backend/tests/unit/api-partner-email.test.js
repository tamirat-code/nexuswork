import { apiPartnerKeyEmail } from "../../src/templates/email/api-partner-key.template.js";

describe("API partner invitation email", () => {
  it("includes the portal, key, tier, and scopes without rendering HTML input", () => {
    const email = apiPartnerKeyEmail({
      partnerName: "Talent <Integrations>",
      apiKey: "nw_abc12345_secret-value",
      tier: "sandbox",
      scopes: ["talent:read", "usage:read"],
    });

    expect(email.subject).toBe("Your NexusWork partner API access");
    expect(email.html).toContain("Talent &lt;Integrations&gt;");
    expect(email.html).toContain("nw_abc12345_secret-value");
    expect(email.html).toContain("sandbox");
    expect(email.html).toContain("talent:read");
    expect(email.html).toContain("/partner-portal");
    expect(email.html).not.toContain("Talent <Integrations>");
  });
});
