import { mailConfig } from "../../config/mail.config.js";

const BRAND_COLOR = "#008f83";
const BRAND_DARK = "#073b4c";
const GOLD = "#c9a227";
const BODY_BG = "#eef7f5";
const CARD_BG = "#ffffff";
const TEXT_COLOR = "#17333a";
const MUTED_COLOR = "#5f747a";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeUrl(value) {
  try {
    const url = new URL(String(value));
    return /^https?:$/.test(url.protocol) ? escapeHtml(url.toString()) : "";
  } catch {
    return "";
  }
}

export function renderEmailLayout({
  preheader = "",
  title,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  logoUrl = mailConfig.logoUrl,
  footerText = "If you didn't expect this email, you can safely ignore it.",
}) {
  const safeCtaUrl = safeUrl(ctaUrl);
  const safeLogoUrl = safeUrl(logoUrl);
  const safeAppUrl = safeUrl(mailConfig.appUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
  <style>
    @media screen and (max-width: 600px) {
      .email-shell { padding: 20px 12px !important; }
      .email-card { padding: 26px 20px !important; }
      .email-title { font-size: 25px !important; }
      .email-button { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${BODY_BG}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:${TEXT_COLOR};">
  <span style="display:none; max-height:0; max-width:0; overflow:hidden; opacity:0; color:${BODY_BG}; font-size:1px; line-height:1px;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BODY_BG};">
    <tr>
      <td class="email-shell" align="center" style="padding:36px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 4px 22px;">
              ${safeAppUrl ? `<a href="${safeAppUrl}" style="text-decoration:none;">` : ""}
                ${safeLogoUrl ? `<img src="${safeLogoUrl}" width="42" height="46" alt="NexusWork" style="display:inline-block; vertical-align:middle; width:42px; height:46px; margin-right:10px;" />` : ""}
                <span style="display:inline-block; vertical-align:middle; font-size:24px; font-weight:800; letter-spacing:-.04em; color:${BRAND_DARK};">Nexus<span style="color:${BRAND_COLOR};">Work</span></span>
              ${safeAppUrl ? "</a>" : ""}
            </td>
          </tr>
          <tr>
            <td class="email-card" style="background:${CARD_BG}; border:1px solid #d7e8e4; border-top:4px solid ${BRAND_COLOR}; border-radius:18px; padding:38px 40px; box-shadow:0 12px 32px rgba(7,59,76,.10);">
              <div style="width:44px; height:4px; margin-bottom:22px; border-radius:3px; background:${GOLD};"></div>
              <h1 class="email-title" style="margin:0 0 16px; color:${TEXT_COLOR}; font-size:29px; line-height:1.2; letter-spacing:-.03em;">${escapeHtml(title)}</h1>
              <div style="font-size:16px; line-height:1.7; color:${TEXT_COLOR};">${bodyHtml}</div>
              ${safeCtaUrl ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr><td style="border-radius:10px; background:${BRAND_COLOR}; box-shadow:0 6px 16px rgba(0,143,131,.26);"><a class="email-button" href="${safeCtaUrl}" style="display:inline-block; padding:14px 24px; border:1px solid ${BRAND_COLOR}; border-radius:10px; color:#fff; font-size:15px; font-weight:700; text-decoration:none;">${escapeHtml(ctaLabel || "Open NexusWork")} &nbsp;→</a></td></tr></table><p style="margin:20px 0 0; color:${MUTED_COLOR}; font-size:12px; line-height:1.6;">Button not working? Copy and paste this link into your browser:<br /><a href="${safeCtaUrl}" style="color:${BRAND_COLOR}; word-break:break-all;">${safeCtaUrl}</a></p>` : ""}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 10px 0; color:${MUTED_COLOR}; font-size:12px; line-height:1.7;">
              <a href="${safeAppUrl || "#"}" style="color:${BRAND_COLOR}; font-weight:700; text-decoration:none;">NexusWork</a> — Student Freelance Marketplace<br />
              ${escapeHtml(footerText)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
