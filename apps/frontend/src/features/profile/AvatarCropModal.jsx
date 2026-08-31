import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Modal, ProgressBar } from "../../components/ui/index.js";
import Spinner from "../../components/loaders/Spinner.jsx";

const OUTPUT_SIZE = 512;
const VIEW = 288; // on-screen crop viewport (square)


export default function AvatarCropModal({ open, file, uploading = false, progress, error, onCancel, onConfirm }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Decode the picked file into an <img> we can draw from.
  useEffect(() => {
    if (!open || !file) return;
    let url;
    let cancelled = false;

    setStatus("loading");
    setLoadError("");
    setImage(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setImage(img);
      setStatus("ready");
    };
    img.onerror = () => {
      if (cancelled) return;
      setStatus("error");
      setLoadError("We couldn't read that image. Try a different JPG, PNG or WebP file.");
    };
    img.src = url;

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, file]);

  const baseScale = image ? VIEW / Math.min(image.width, image.height) : 1;

  const clamp = useCallback(
    (next, z = zoom) => {
      if (!image) return { x: 0, y: 0 };
      const scale = baseScale * z;
      const maxX = Math.max(0, (image.width * scale - VIEW) / 2);
      const maxY = Math.max(0, (image.height * scale - VIEW) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [image, baseScale, zoom]
  );

  // Paint the current pan/zoom into the preview canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    const scale = baseScale * zoom;
    const w = image.width * scale;
    const h = image.height * scale;

    ctx.clearRect(0, 0, VIEW, VIEW);
    ctx.fillStyle = "#0d1b1c";
    ctx.fillRect(0, 0, VIEW, VIEW);
    ctx.drawImage(image, VIEW / 2 - w / 2 + offset.x, VIEW / 2 - h / 2 + offset.y, w, h);
  }, [image, zoom, offset, baseScale]);

  function startDrag(event) {
    if (!image || uploading) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, origin: offset };
  }

  function moveDrag(event) {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(clamp({ x: drag.origin.x + (event.clientX - drag.x), y: drag.origin.y + (event.clientY - drag.y) }));
  }

  function endDrag() {
    dragRef.current = null;
  }

  function nudge(event) {
    const step = event.shiftKey ? 24 : 8;
    const moves = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setOffset((prev) => clamp({ x: prev.x + move.x, y: prev.y + move.y }));
  }

  function changeZoom(next) {
    setZoom(next);
    setOffset((prev) => clamp(prev, next));
  }

  function confirm() {
    if (!image) return;
    const out = document.createElement("canvas");
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext("2d");
    const ratio = OUTPUT_SIZE / VIEW;
    const scale = baseScale * zoom * ratio;
    const w = image.width * scale;
    const h = image.height * scale;

    ctx.fillStyle = "#0d1b1c";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(
      image,
      OUTPUT_SIZE / 2 - w / 2 + offset.x * ratio,
      OUTPUT_SIZE / 2 - h / 2 + offset.y * ratio,
      w,
      h
    );

    onConfirm?.(out.toDataURL("image/jpeg", 0.86));
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t("settings.cropPhotoTitle") || "Crop your photo"}
      description={t("settings.cropPhotoDesc") || "Drag to reposition, or use the arrow keys once the crop area is focused."}
      size="md"
      dismissible={!uploading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={uploading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={confirm} loading={uploading} disabled={status !== "ready"}>
            {uploading ? t("common.uploading") : t("common.savePhoto")}
          </Button>
        </>
      }
    >
      <div aria-live="polite" className="space-y-4">
        {(error || loadError) && (
          <Alert live variant="danger" title={t("settings.photoNotSaved")}>
            {error || loadError}
          </Alert>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-10 text-sm text-slate-300">
            <Spinner />
            <p>{t("common.preparingPhoto")}</p>
          </div>
        )}

        {status === "error" && !loadError && (
          <p className="py-10 text-center text-sm text-slate-300">{t("common.nothingToCrop")}</p>
        )}

        {status === "ready" && (
          <>
            <div
              role="application"
              tabIndex={0}
              aria-label="Crop area — drag or use arrow keys to reposition the photo"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={nudge}
              className="relative mx-auto w-[288px] cursor-grab touch-none overflow-hidden rounded-card border border-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink active:cursor-grabbing"
            >
              <canvas ref={canvasRef} width={VIEW} height={VIEW} className="block h-[288px] w-[288px]" />
              {/* Circle guide showing what will be visible as an avatar. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-card"
                style={{
                  boxShadow: "0 0 0 9999px rgba(6,17,18,0.55) inset",
                  clipPath: "circle(50% at 50% 50%)",
                  outline: "1px solid rgba(203,161,90,0.6)",
                  outlineOffset: "-1px",
                  borderRadius: "9999px",
                }}
              />
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.02}
                value={zoom}
                disabled={uploading}
                onChange={(e) => changeZoom(Number(e.target.value))}
                className="w-full accent-brass"
                aria-valuetext={`${zoom.toFixed(2)}×`}
              />
            </label>

            {typeof progress === "number" && uploading && (
              <ProgressBar value={progress} label={t("common.uploadingPhoto")} showValue />
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

