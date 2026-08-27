import PDFDocument from "pdfkit";
import { env } from "../../config/env.js";

function formatDate(date) {
  if (!date) return "Issued by NexusWork";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function text(value, fallback = "Not provided") {
  return String(value || fallback);
}

export function renderCredentialCardPdf(credential) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const subject = credential.credentialSubject || {};
    const achievement = subject.achievement || {};
    const proof = credential.proof || {};
    const skills = Array.isArray(achievement.alignment) ? achievement.alignment : [];
    const issued = formatDate(credential.validFrom || proof.created);
    const verifyUrl = `${env.clientUrl || "http://localhost:5173"}/verify-credential`;
    const proofPreview = proof.proofValue
      ? `${String(proof.proofValue).slice(0, 22)}...${String(proof.proofValue).slice(-14)}`
      : "No proof value";

    doc.rect(0, 0, 595.28, 841.89).fill("#edf7f5");
    doc.roundedRect(46, 78, 503, 635, 22).fill("#ffffff");
    doc.rect(46, 78, 503, 252).fill("#07313a");
    doc.rect(46, 78, 503, 7).fill("#00a99d");

    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("NexusWork", 78, 112)
      .fontSize(10)
      .fillColor("#7ddbd3")
      .text("VERIFIED CREDENTIAL CARD", 78, 158, { characterSpacing: 2 });

    doc
      .fontSize(42)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text(text(subject.name, "Verified student"), 78, 188, { width: 410, lineGap: 2 });

    doc
      .fontSize(13)
      .fillColor("#c8f4ef")
      .font("Helvetica")
      .text(text(achievement.description, "University-backed student credential."), 78, 282, { width: 430, lineGap: 4 });

    doc.roundedRect(78, 365, 180, 30, 15).fill("#ccfbf1");
    doc
      .fontSize(8)
      .fillColor("#075e59")
      .font("Helvetica-Bold")
      .text("SIGNED VC / OPEN BADGE", 96, 376, { characterSpacing: 1.4 });

    const leftX = 78;
    const rightX = 315;
    let y = 430;

    function labelValue(label, value, x, currentY, width = 195) {
      doc
        .fontSize(8)
        .fillColor("#647c7e")
        .font("Helvetica-Bold")
        .text(label.toUpperCase(), x, currentY, { characterSpacing: 1.2 });
      doc
        .fontSize(13)
        .fillColor("#082f35")
        .font("Helvetica-Bold")
        .text(text(value), x, currentY + 16, { width, lineGap: 2 });
    }

    labelValue("Credential", achievement.name || credential.name, leftX, y, 210);
    labelValue("Issuer", credential.issuer?.name || "NexusWork", rightX, y, 180);
    y += 82;
    labelValue("Issued", issued, leftX, y, 210);
    labelValue("Status", credential.credentialStatus?.status || "active", rightX, y, 180);

    y += 92;
    doc
      .fontSize(8)
      .fillColor("#647c7e")
      .font("Helvetica-Bold")
      .text("CERTIFIED SKILLS", leftX, y, { characterSpacing: 1.2 });
    let skillY = y + 22;
    const skillList = skills.length ? skills : [{ name: "University enrollment verified" }];
    for (const skill of skillList.slice(0, 6)) {
      doc.roundedRect(leftX, skillY, 205, 24, 12).strokeColor("#b8dad5").lineWidth(1).stroke();
      doc
        .fontSize(10)
        .fillColor("#0f4f51")
        .font("Helvetica-Bold")
        .text(`${skill.name}${skill.level ? ` - ${skill.level}` : ""}`, leftX + 12, skillY + 7, { width: 180 });
      skillY += 31;
    }

    doc
      .moveTo(78, 650)
      .lineTo(517, 650)
      .strokeColor("#cfe1de")
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(9)
      .fillColor("#547072")
      .font("Helvetica")
      .text("Cryptographic proof is included in the signed VC/Open Badge export. Verify this credential at:", 78, 670, {
        width: 430,
      })
      .fillColor("#073f45")
      .font("Helvetica-Bold")
      .text(verifyUrl, 78, 690, { width: 430 })
      .fillColor("#547072")
      .font("Helvetica")
      .text(`Proof preview: ${proofPreview}`, 78, 714, { width: 430 });

    doc
      .fontSize(8)
      .fillColor("#7b9294")
      .text("This PDF is a human-readable credential card. Use the signed VC/Open Badge file for automated tamper verification.", 78, 770, {
        width: 430,
      });

    doc.end();
  });
}
