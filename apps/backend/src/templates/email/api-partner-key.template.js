import { mailConfig } from "../../config/mail.config.js";
import { renderEmailLayout } from "./layout.template.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function apiPartnerKeyEmail({ partnerName, apiKey, tier, scopes }) {
  const portalUrl = `${mailConfig.appUrl}/partner-portal`;
  const safeScopes = (scopes || []).map(escapeHtml).join(", ");

  return {
    subject: "Your NexusWork partner API access",
    html: renderEmailLayout({
      preheader: "Your NexusWork partner API key is ready. Store it securely.",
      title: "Partner API access is ready",
      bodyHtml: `
        <p>Hello ${escapeHtml(partnerName)},</p>
        <p>Your NexusWork partner integration has been provisioned on the <strong>${escapeHtml(tier)}</strong> tier.</p>
        <p style="margin-bottom:8px;"><strong>Your one-time API key</strong></p>
        <p style="margin:0 0 20px; padding:14px; border:1px solid #d7e8e4; border-radius:10px; background:#f5fbf9; color:#073b4c; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; line-height:1.6; word-break:break-all;">${escapeHtml(apiKey)}</p>
        <p><strong>Granted scopes:</strong> ${safeScopes || "None"}</p>
        <p>Store this key in your server secret manager. Do not commit it to source control or share it publicly. If you believe it was exposed, connect to the partner portal and revoke it immediately.</p>
      `,
      ctaLabel: "Open partner portal",
      ctaUrl: portalUrl,
      footerText: "This message contains a sensitive API credential. Delete it after storing the key securely.",
    }),
  };
}
