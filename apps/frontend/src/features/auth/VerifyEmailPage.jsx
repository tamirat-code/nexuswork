import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../../services/api/auth.api.js";
import AuthShell from "./components/AuthShell.jsx";
import { SealMark } from "./components/AuthShell.jsx";
import Skeleton from "../../components/loaders/Skeleton.jsx";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("This link is missing a verification token.");
      return;
    }
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err.message);
      });
  }, [token]);

  if (status === "verifying") {
    return (
      <AuthShell eyebrow="One moment" title="Verifying your email…">
        <Skeleton className="h-11 w-full" />
      </AuthShell>
    );
  }

  if (status === "success") {
    return (
      <AuthShell eyebrow="Verified" title="Email confirmed">
        <div className="rounded-card border border-escrow bg-escrow-100 p-5 flex gap-3">
          <SealMark className="h-5 w-5 shrink-0 text-escrow mt-0.5" />
          <p className="text-sm text-slate">Your email is verified. You're all set.</p>
        </div>
        <Link to="/dashboard" className="mt-6 inline-block text-sm font-semibold text-brass hover:underline">
          Go to dashboard
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Verification failed" title="This link didn't work">
      <div className="rounded-card border border-brick bg-brick-100 p-5">
        <p className="text-sm text-slate">{error}</p>
      </div>
      <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brass hover:underline">
        Back to login
      </Link>
    </AuthShell>
  );
}