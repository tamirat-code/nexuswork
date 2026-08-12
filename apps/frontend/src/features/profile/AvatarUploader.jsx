import { useRef, useState } from "react";
import { Alert, Avatar, Button } from "../../components/ui/index.js";
import AvatarCropModal from "./AvatarCropModal.jsx";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 5;

/** Client-side gate so obviously-bad files never reach the API. */
export function validateAvatarFile(file) {
  if (!file) return "Choose an image file to upload.";
  if (!ACCEPTED.includes(file.type)) return "Use a JPG, PNG or WebP image.";
  if (file.size > MAX_MB * 1024 * 1024) return `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — keep it under ${MAX_MB} MB.`;
  if (file.size === 0) return "That file is empty. Try exporting it again.";
  return "";
}


export default function AvatarUploader({
  name,
  src,
  verified = false,
  uploading = false,
  removing = false,
  uploadError = "",
  onUpload,
  onRemove,
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [pickError, setPickError] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  function pick(list) {
    const next = list?.[0];
    const message = validateAvatarFile(next);
    setPickError(message);
    if (message) return;
    setFile(next);
    setCropOpen(true);
  }

  async function confirmCrop(dataUrl) {
    try {
      await onUpload?.(dataUrl);
      setCropOpen(false);
      setFile(null);
    } catch {
      /* Error copy is rendered from `uploadError`; keep the cropper open. */
    }
  }

  const hasPhoto = Boolean(src);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        {hasPhoto ? (
          <Avatar name={name} src={src} size="xl" verified={verified} decorative />
        ) : (
          // Empty state: say what's missing instead of showing a bare circle.
          <span
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-dashed border-ink-300 bg-ink-700/40 text-center sm:h-24 sm:w-24"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7 text-slate-300">
              <circle cx="12" cy="9" r="3.2" />
              <path d="M5 19.5c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5" strokeLinecap="round" />
            </svg>
          </span>
        )}

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate">{hasPhoto ? "Profile photo" : "No photo yet"}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Square JPG, PNG or WebP up to {MAX_MB} MB. You'll be able to crop it before saving.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant={hasPhoto ? "secondary" : "primary"}
              size="sm"
              onClick={() => inputRef.current?.click()}
              loading={uploading}
            >
              {hasPhoto ? "Replace photo" : "Upload photo"}
            </Button>
            {hasPhoto && onRemove && (
              <Button variant="danger-ghost" size="sm" onClick={onRemove} loading={removing}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ACCEPTED.join(",")}
        aria-label="Choose a profile photo"
        onChange={(event) => {
          pick(event.target.files);
          event.target.value = "";
        }}
      />

      <div aria-live="polite">
        {pickError && (
          <Alert live variant="danger" title="That file won't work">
            {pickError}
          </Alert>
        )}
        {!cropOpen && uploadError && (
          <Alert live variant="danger" title="Photo not saved">
            {uploadError}
          </Alert>
        )}
      </div>

      <AvatarCropModal
        open={cropOpen}
        file={file}
        uploading={uploading}
        error={cropOpen ? uploadError : ""}
        onCancel={() => {
          if (uploading) return;
          setCropOpen(false);
          setFile(null);
        }}
        onConfirm={confirmCrop}
      />
    </div>
  );
}
