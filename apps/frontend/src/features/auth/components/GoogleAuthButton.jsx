import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useTranslation } from "react-i18next";

export default function GoogleAuthButton({ onCredential, disabled }) {
  const { i18n } = useTranslation();
  const containerRef = useRef(null);
  
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width) || 320);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={disabled ? "pointer-events-none opacity-50" : ""}>
      <GoogleLogin
        onSuccess={(response) => onCredential(response.credential)}
        onError={() => onCredential(null, new Error("Google sign-in failed. Please try again."))}
        width={width}
        shape="rectangular"
        theme="outline"
        text="continue_with"
        locale={i18n.language}
      />
    </div>
  );
}