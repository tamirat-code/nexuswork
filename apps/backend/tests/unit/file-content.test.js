import { validateUploadedFile } from "../../src/modules/files/files.upload.js";

describe("uploaded file content validation", () => {
  it("accepts a PDF whose bytes match its declared MIME type", async () => {
    const result = await validateUploadedFile({
      mimetype: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\nvalid test content"),
    });

    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects content that only claims to be a PDF", async () => {
    await expect(validateUploadedFile({
      mimetype: "application/pdf",
      buffer: Buffer.from("<html>not a PDF</html>"),
    })).rejects.toThrow("File content does not match its declared type");
  });

  it("rejects binary data uploaded as text", async () => {
    await expect(validateUploadedFile({
      mimetype: "text/plain",
      buffer: Buffer.from([0x74, 0x65, 0x78, 0x74, 0x00, 0xff]),
    })).rejects.toThrow("File content does not match its declared type");
  });
});
