export default function FormError({ message }) {
  if (!message) return null;
  return (
    <p className="text-[13px] text-brick" role="alert">
      {message}
    </p>
  );
}
