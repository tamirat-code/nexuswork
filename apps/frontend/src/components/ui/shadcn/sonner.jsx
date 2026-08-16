import { Toaster as Sonner } from "sonner";

function Toaster({ ...props }) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-ink-700 group-[.toaster]:text-slate group-[.toaster]:border-ink-300 group-[.toaster]:shadow-elevated",
          description: "group-[.toast]:text-slate-300",
          actionButton: "group-[.toast]:bg-brass group-[.toast]:text-ink",
          cancelButton: "group-[.toast]:bg-ink-100 group-[.toast]:text-slate",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
