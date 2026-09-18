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
          className="rounded p-1 text-content-muted hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    />
  );
}
