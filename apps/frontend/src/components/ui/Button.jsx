export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "rounded px-4 py-2 text-sm font-medium disabled:opacity-50";
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
