import { useRef, useState } from "react";
import Button from "./Button.jsx";
import ProgressBar from "./ProgressBar.jsx";
import { cn } from "../../lib/cn.js";
import { reportValidation } from "../../lib/validation.js";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  label = "Upload files",
  hint,
  accept,
  multiple = false,
  maxSizeMb = 10,
  maxFiles,
  files = [],
  progress,
  onFilesSelected,
  onRemove,
  disabled = false,
  className = "",
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function validate(list) {
    const accepted = [];
    if (maxFiles && list.length > maxFiles) {
      const message = `You can select up to ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`;
      setError(message); reportValidation(message, { input: "file-upload" });
      return [];
    }
    for (const file of list) {
      if (!file.size) { const message = `${file.name} is empty.`; setError(message); reportValidation(message, { input: "file-upload", file: file.name }); continue; }
      if (file.size > maxSizeMb * 1024 * 1024) {
        const message = `${file.name} is larger than ${maxSizeMb} MB.`;
        setError(message); reportValidation(message, { input: "file-upload", file: file.name });
        continue;
      }
      if (accept && accept !== "*/*") {
        const rules = accept.split(",").map((item) => item.trim().toLowerCase());
        const name = file.name.toLowerCase();
        const allowed = rules.some((rule) => rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? file.type.startsWith(rule.slice(0, -1)) : file.type === rule);
        if (!allowed) { const message = `${file.name} is not an accepted file type.`; setError(message); reportValidation(message, { input: "file-upload", file: file.name }); continue; }
      }
      accepted.push(file);
    }
    if (accepted.length) setError("");
    return accepted;
  }

  function handleFiles(list) {
    const accepted = validate(Array.from(list));
    if (accepted.length) onFilesSelected?.(multiple ? accepted : [accepted[0]]);
  }

  return (
    <div className={className}>
      <p className="mb-1.5 text-sm font-medium text-slate">{label}</p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed px-6 py-8 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
          dragging ? "border-brass bg-brass/5" : "border-ink-300 bg-ink-700/40 hover:border-brass/40",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-6 w-6 text-brass">
          <path d="M12 16V4m-4 4 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium text-slate">
          Drop {multiple ? "files" : "a file"} here, or <span className="text-brass">browse</span>
        </span>
        <span className="text-xs text-slate-300">{hint || `Up to ${maxSizeMb} MB${accept ? ` · ${accept}` : ""}`}</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && (
        <p role="alert" className="mt-2 text-xs text-brick">
          {error}
        </p>
      )}

      {typeof progress === "number" && progress < 100 && (
        <ProgressBar className="mt-3" value={progress} label="Uploading" showValue />
      )}

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, i) => (
            <li
              key={file.id ?? `${file.name}-${i}`}
              className="flex items-center gap-3 rounded-control border border-ink-300 bg-ink px-3 py-2"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-300">
                <path d="M9 1.5H4.5A1.5 1.5 0 0 0 3 3v10A1.5 1.5 0 0 0 4.5 14.5h7A1.5 1.5 0 0 0 13 13V5.5L9 1.5Z" />
                <path d="M9 1.5V5.5h4" />
              </svg>
              <span className="min-w-0 flex-1 truncate text-sm text-slate">{file.name}</span>
              {typeof file.size === "number" && (
                <span className="shrink-0 text-xs text-slate-300 tabular-nums">{formatSize(file.size)}</span>
              )}
              {onRemove && (
                <Button variant="ghost" size="xs" iconOnly aria-label={`Remove ${file.name}`} onClick={() => onRemove(file, i)}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true" className="h-3.5 w-3.5">
                    <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" strokeLinecap="round" />
                  </svg>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
