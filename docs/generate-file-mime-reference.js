const PDFDocument = require("pdfkit");
const fs = require("fs");

const output = "/home/tamirat/nexuswork/docs/nexuswork-file-mime-reference.pdf";
fs.mkdirSync("/home/tamirat/nexuswork/docs", { recursive: true });
const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
doc.pipe(fs.createWriteStream(output));

const colors = { ink: "#12212B", teal: "#008F87", muted: "#52616B", line: "#D7E1E4", soft: "#EEF7F6" };
function title(text) { doc.fillColor(colors.ink).fontSize(20).font("Helvetica-Bold").text(text); doc.moveDown(0.35); }
function heading(text) { doc.moveDown(0.65); doc.fillColor(colors.teal).fontSize(13).font("Helvetica-Bold").text(text); doc.moveDown(0.2); }
function para(text) { doc.fillColor(colors.ink).fontSize(9.5).font("Helvetica").text(text, { lineGap: 3 }); doc.moveDown(0.25); }
function item(text) { doc.fillColor(colors.ink).fontSize(9).font("Helvetica").text(`• ${text}`, { lineGap: 2, indent: 10 }); }
function table(headers, rows, widths) {
  const x = doc.x; let y = doc.y; const rowHeight = 24;
  const drawRow = (values, header = false) => {
    let xx = x;
    doc.fillColor(header ? colors.teal : (Math.floor((y - doc.y) / rowHeight) % 2 ? "#FFFFFF" : colors.soft)).rect(x, y, widths.reduce((a,b) => a+b, 0), rowHeight).fill();
    values.forEach((value, i) => { doc.fillColor(header ? "#FFFFFF" : colors.ink).fontSize(header ? 8 : 7.2).font(header ? "Helvetica-Bold" : "Helvetica").text(String(value), xx + 4, y + 7, { width: widths[i] - 8, height: rowHeight - 6, ellipsis: true }); xx += widths[i]; });
    doc.strokeColor(colors.line).rect(x, y, widths.reduce((a,b) => a+b, 0), rowHeight).stroke();
    y += rowHeight;
    if (y > 755) { doc.addPage(); y = 48; }
  };
  drawRow(headers, true); rows.forEach((row) => drawRow(row)); doc.y = y;
}

title("NexusWork File MIME & Functionality Reference");
para("Generated September 2026 · Source of truth: apps/backend/src/modules/files/files.upload.js and the frontend file upload components.");
heading("Executive summary");
para("Every file upload is checked twice: first by MIME type plus filename extension, then by the file's binary signature or valid UTF-8 text content. A file is accepted only when both checks pass. The backend default upload limit is 20 MB (MAX_FILE_SIZE_MB can change this in deployment). Files are private and are served only after authentication and resource-authorization checks.");
heading("Accepted MIME types and extensions");
table(["MIME type", "Accepted extensions", "Signature/content check"], [
  ["application/pdf", ".pdf", "PDF %PDF- header"],
  ["image/jpeg", ".jpg, .jpeg", "JPEG FF D8 FF"],
  ["image/png", ".png", "PNG signature"],
  ["image/webp", ".webp", "RIFF/WEBP"],
  ["image/gif", ".gif", "GIF87a or GIF89a"],
  ["image/svg+xml", ".svg", "UTF-8 text fallback"],
  ["text/plain", ".txt, .md, .markdown, .js, .jsx, .mjs, .cjs, .ts, .tsx, .py, .html, .htm, .css, .csv, .xml", "Valid UTF-8, no NUL"],
  ["text/markdown", ".md, .markdown", "Valid UTF-8, no NUL"],
  ["text/javascript / application/javascript", ".js, .jsx, .mjs, .cjs", "Valid UTF-8, no NUL"],
  ["text/typescript / application/typescript", ".ts, .tsx", "Valid UTF-8, no NUL"],
  ["text/html", ".html, .htm", "Valid UTF-8, no NUL"],
  ["text/css", ".css", "Valid UTF-8, no NUL"],
  ["application/json", ".json", "Valid UTF-8, no NUL"],
  ["text/csv", ".csv", "Valid UTF-8, no NUL"],
  ["application/xml / text/xml", ".xml", "Valid UTF-8, no NUL"],
  ["text/x-python / application/x-python-code", ".py", "Valid UTF-8, no NUL"],
  ["application/msword", ".doc", "OLE compound document"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx", "ZIP container"],
  ["application/vnd.ms-excel", ".xls, .csv", "OLE or valid UTF-8 text"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx", "ZIP container"],
  ["application/vnd.ms-powerpoint", ".ppt", "OLE compound document"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx", "ZIP container"],
  ["video/mp4", ".mp4", "ftyp container"],
  ["video/webm", ".webm", "EBML signature"],
  ["video/quicktime", ".mov", "ftyp container"],
  ["audio/mpeg", ".mp3", "ID3 or MPEG frame"],
  ["audio/wav / audio/x-wav", ".wav", "RIFF/WAVE"],
  ["application/zip / application/x-zip-compressed", ".zip", "ZIP PK header"],
], [190, 150, 115]);

heading("Functionality matrix");
table(["Feature", "Frontend rule", "Backend related_type / behavior"], [
  ["Profile avatar", "image/jpeg, image/png, image/webp; max 5 MB", "Not a File record; base64 data URL is uploaded to S3 avatars/"],
  ["Student enrollment proof", "JPEG, PNG, WebP, PDF; max 10 MB", "verification_document; private, university staff reviews"],
  ["Staff employment proof", "JPEG, PNG, WebP, PDF; max 10 MB", "staff_verification_document; private, platform admin reviews"],
  ["Skill certification evidence", "PDF, PNG, JPG/JPEG, WebP, ZIP, TXT; max 10 MB UI", "skill_certification_evidence; private, university reviewer accesses"],
  ["Proposal CV / resume", "PDF, DOC, DOCX input; backend allowlist applies", "cv; private, authorized project parties can view"],
  ["Project attachments", "Uses generic upload; backend allowlist and global size limit", "project_attachment; private, project participants access"],
  ["Milestone deliverables", "Uses generic upload; backend allowlist and global size limit", "milestone_submission; private, contract parties access"],
  ["Chat attachments", "Any backend-allowed file; frontend max 10 MB", "message_attachment; private, contract participants access"],
  ["Contract file exchange", "Any backend-allowed file; UI validates contract file rules", "message_attachment / contract access"],
], [130, 185, 140]);

heading("Upload and security flow");
[
  "1. Frontend chooses a file and may apply a feature-specific accept list and size limit.",
  "2. POST /v1/files/upload with multipart field name file; authentication is required.",
  "3. Multer checks the declared MIME type and lowercase filename extension.",
  "4. validateUploadedFile checks magic bytes for binary formats or valid UTF-8 text and calculates SHA-256.",
  "5. Optional OPSWAT scanning runs before the database record is created.",
  "6. The file is stored locally or in private S3-compatible object storage; generated storage names are random.",
  "7. Database keeps original_name for the user's true filename, plus mimetype, size, hash, owner, and related resource.",
  "8. GET /v1/files/content/:id requires authentication and resource authorization. Preview uses a short-lived signed URL; download uses attachment disposition.",
].forEach(item);

heading("Preview, download, and filename behavior");
para("Preview is initiated by openFilePreview() in apps/frontend/src/services/api/files.api.js. It authenticates with the API, requests a short-lived signed object-storage URL, and opens the file in a new tab. Downloads use downloadFile(), request the content endpoint with download=1, read Content-Disposition, and create a browser download using the original filename.");
para("Original filenames are normalized for UTF-8/Latin-1 corruption in the backend and display layer. Filename metadata is separate from the random storage filename, so changing a displayed filename does not change the stored object key.");
heading("Important operational notes");
[
  "The browser's file picker accept attribute is only a convenience; backend validation is authoritative.",
  "A MIME type and extension must agree. For example, application/pdf with .jpg is rejected.",
  "The backend default is 20 MB, but deployment can override it with MAX_FILE_SIZE_MB.",
  "Some browser-generated files report an empty or unusual MIME type; they may be rejected even if the extension looks valid.",
  "Private S3 objects need valid credentials and a configured bucket. Signed URLs expire; the API generates fresh URLs for file previews.",
  "Existing database records retain their original MIME metadata. Changing the allowlist does not retroactively change old files.",
].forEach(item);

const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(i); doc.fillColor(colors.muted).fontSize(8).text(`NexusWork · File MIME Reference · ${i + 1} / ${pages.count}`, 48, 805, { align: "center", width: 499 });
}
doc.end();
