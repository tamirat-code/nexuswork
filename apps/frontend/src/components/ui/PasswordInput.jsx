import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Input from "./Input.jsx";

export default function PasswordInput({ id, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      id={id}
      type={visible ? "text" : "password"}
      trailingSlot={(
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="rounded p-1 text-slate-300 hover:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    />
  );
}
