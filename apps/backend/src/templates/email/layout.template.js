const BRAND_COLOR = "#008f83";
const BRAND_DARK = "#073b4c";
const GOLD = "#d6a84f";
const BODY_BG = "#eef7f5";
const CARD_BG = "#ffffff";
const TEXT_COLOR = "#17333a";
const MUTED_COLOR = "#5f747a";

export function renderEmailLayout({ preheader = "", title, bodyHtml, ctaLabel, ctaUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:${BODY_BG}; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
  <span style="display:none; font-size:1px; color:${BODY_BG}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    ${preheader}
  </span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BODY_BG}; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px;">

          <tr>
            <td style="padding: 0 0 24px 0;">
              <span style="font-size: 22px; font-weight: 800; letter-spacing:-0.03em; color: ${BRAND_DARK};">Nexus<span style="color:${BRAND_COLOR};">Work</span></span>
            </td>
          </tr>

          <tr>
            <td style="background-color:${CARD_BG}; border-radius: 16px; padding: 32px; border:1px solid #d7e8e4; box-shadow: 0 10px 30px rgba(7,59,76,0.10);">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; color: ${TEXT_COLOR};">${title}</h1>
              <div style="font-size: 15px; line-height: 1.6; color: ${TEXT_COLOR};">
                ${bodyHtml}
              </div>

              ${
                ctaUrl
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                       <tr>
                         <td style="background:linear-gradient(135deg,${BRAND_COLOR},#00a99a); border-radius: 9px; box-shadow:0 5px 14px rgba(0,143,131,0.25);">
                           <a href="${ctaUrl}" style="display:inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color:#ffffff; text-decoration:none;">
                             ${ctaLabel}
                           </a>
                         </td>
                       </tr>
                     </table>
                     <p style="margin-top: 16px; font-size: 12px; color: ${MUTED_COLOR}; word-break: break-all;">
                       Or paste this link into your browser:<br />
                       <a href="${ctaUrl}" style="color: ${MUTED_COLOR};">${ctaUrl}</a>
                     </p>`
                  : ""
              }
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 8px 0 8px; font-size: 12px; color: ${MUTED_COLOR}; text-align: center;">
              NexusWork — Student Freelance Marketplace<br />
              If you didn't expect this email, you can safely ignore it.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
