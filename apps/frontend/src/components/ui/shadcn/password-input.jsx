import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input.jsx";

export default function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={`pr-10 ${className || ""}`} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-300 hover:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
