export function displayFilename(value, fallback = "file") {
  const filename = String(value || "");
  if (!filename) return fallback;
  if (!/[\u00c0-\u00ff]/.test(filename) || typeof TextDecoder === "undefined") return filename;
  try {
    const bytes = Uint8Array.from(filename, (character) => character.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return decoded && !decoded.includes("\ufffd") ? decoded : filename;
  } catch {
    return filename;
  }
}
