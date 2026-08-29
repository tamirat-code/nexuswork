import { env } from "../../config/env.js";
import { AppError, ValidationError } from "../../shared/exceptions/AppError.js";

const DEFAULT_SCAN_TIMEOUT_MS = 30_000;

function scannerError(message = "File security scanning is temporarily unavailable. Please try again.") {
  return new AppError(message, 503, "FILE_SCAN_UNAVAILABLE");
}

function isScanComplete(result) {
  const progress = Number(
    result?.scan_results?.progress_percentage ??
    result?.process_info?.progress_percentage ??
    result?.progress_percentage
  );
  return Number.isFinite(progress) && progress >= 100;
}

function isClean(result) {
  const scanResults = result?.scan_results || {};
  // MetaDefender uses scan_all_result_i as the infection flag: 0 is clean.
  return scanResults.scan_all_result_i === 0 &&
    Number(scanResults.total_detected_avs || 0) === 0 &&
    scanResults.scan_result_i !== 253;
}

async function request(url, options) {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(env.fileScanTimeoutMs || DEFAULT_SCAN_TIMEOUT_MS),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw scannerError("The OPSWAT scanner rejected the API key or private-scan permission.");
      }
      throw scannerError();
    }
    return response.json();
  } catch (error) {
    if (error?.code === "FILE_SCAN_UNAVAILABLE") throw error;
    throw scannerError();
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Submit an upload to OPSWAT and wait for a completed clean result. */
export async function scanUploadedFile({ buffer, originalName, mimetype }) {
  if (env.fileScanProvider === "none") {
    return { clean: true, skipped: true, provider: "none" };
  }

  if (env.fileScanProvider !== "opswat" || !env.opswatApiKey) {
    throw scannerError("OPSWAT file scanning is not configured.");
  }

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimetype }), originalName);
  const headers = { apikey: env.opswatApiKey, filename: originalName };
  if (env.opswatPrivateScan) headers.samplesharing = "0";

  const baseUrl = env.opswatApiBaseUrl.replace(/\/$/, "");
  const submitted = await request(`${baseUrl}/file`, { method: "POST", headers, body: form });
  const dataId = submitted?.data_id;
  if (!dataId) throw scannerError();

  const deadline = Date.now() + (env.fileScanTimeoutMs || DEFAULT_SCAN_TIMEOUT_MS);
  let result = submitted;
  while (!isScanComplete(result)) {
    if (Date.now() >= deadline) throw scannerError("The OPSWAT scan took too long. Please try again.");
    await wait(env.fileScanPollIntervalMs);
    result = await request(`${baseUrl}/file/${encodeURIComponent(dataId)}`, {
      method: "GET",
      headers: { apikey: env.opswatApiKey },
    });
  }

  if (!isClean(result)) {
    throw new ValidationError("This file was rejected by the OPSWAT security scan.", "MALWARE_DETECTED");
  }

  return { clean: true, skipped: false, provider: "opswat", dataId };
}
