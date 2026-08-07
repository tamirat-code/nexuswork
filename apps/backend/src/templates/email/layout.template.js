const BRAND_COLOR = "#111827";
const BODY_BG = "#f4f4f5";
const CARD_BG = "#ffffff";
const TEXT_COLOR = "#1f2937";
const MUTED_COLOR = "#6b7280";

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
              <span style="font-size: 20px; font-weight: 700; color: ${BRAND_COLOR};">NexusWork</span>
            </td>
          </tr>

          <tr>
            <td style="background-color:${CARD_BG}; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; color: ${TEXT_COLOR};">${title}</h1>
              <div style="font-size: 15px; line-height: 1.6; color: ${TEXT_COLOR};">
                ${bodyHtml}
              </div>

              ${
                ctaUrl
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                       <tr>
                         <td style="background-color:${BRAND_COLOR}; border-radius: 8px;">
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