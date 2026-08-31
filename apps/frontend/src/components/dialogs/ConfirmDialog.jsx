import { useTranslation } from "react-i18next";
import Button from "../ui/Button.jsx";
import Modal from "../ui/Modal.jsx";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "primary",
  loading = false,
  onConfirm,
  onCancel,
  children,
}) {
  const { t } = useTranslation();
  const finalTitle = title || t("common.areYouSure");
  const finalConfirmLabel = confirmLabel || t("common.confirm");
  const finalCancelLabel = cancelLabel || t("common.cancel");

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onCancel}
      title={finalTitle}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {finalCancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {finalConfirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm leading-relaxed text-slate-300">{description}</p>}
      {children}
    </Modal>
  );
}

