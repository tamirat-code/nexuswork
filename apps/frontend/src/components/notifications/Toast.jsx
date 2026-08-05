// TODO: swap for a proper toast lib once the notifications module is real.
export default function Toast({ message }) {
  if (!message) return null;
  return <div className="fixed bottom-4 right-4 bg-black text-white text-sm px-4 py-2 rounded">{message}</div>;
}
