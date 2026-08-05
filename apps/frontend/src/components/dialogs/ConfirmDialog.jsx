export default function ConfirmDialog({ open, title, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded p-6 w-80">
        <p className="mb-4">{title}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border rounded">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-sm bg-black text-white rounded">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
