export default function ConfirmDialog({ open, title, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-ink-50 rounded p-6 w-80 border border-ink-300">
        <p className="mb-4 text-slate">{title}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border border-ink-300 rounded text-slate hover:bg-ink-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-sm bg-brass text-ink rounded hover:bg-brass-300">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}