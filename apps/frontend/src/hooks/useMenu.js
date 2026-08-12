import { useCallback, useEffect, useRef, useState } from "react";


export function useMenu({ onSelect } = {}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const close = useCallback(
    (returnFocus = true) => {
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus({ preventScroll: true });
    },
    []
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (menuRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Focus the first item so arrow keys work immediately after opening.
    const items = menuRef.current?.querySelectorAll("[data-menu-item]");
    items?.[0]?.focus({ preventScroll: true });
  }, [open]);

  const handleMenuKeyDown = useCallback(
    (event) => {
      const items = Array.from(menuRef.current?.querySelectorAll("[data-menu-item]") || []);
      const index = items.indexOf(document.activeElement);

      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        items[(index + 1) % items.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1]?.focus();
      } else if (event.key === "Tab") {
        setOpen(false);
      }
    },
    [close]
  );

  const handleTriggerKeyDown = useCallback((event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }, []);

  const selectItem = useCallback(
    (value) => {
      onSelect?.(value);
      close();
    },
    [onSelect, close]
  );

  return {
    open,
    setOpen,
    close,
    selectItem,
    triggerRef,
    menuRef,
    triggerProps: {
      ref: triggerRef,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      onClick: () => setOpen((v) => !v),
      onKeyDown: handleTriggerKeyDown,
    },
    menuProps: {
      ref: menuRef,
      role: "menu",
      onKeyDown: handleMenuKeyDown,
    },
  };
}
