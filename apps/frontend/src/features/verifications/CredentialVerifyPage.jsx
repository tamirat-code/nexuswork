import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BadgeCheck, FileUp, ShieldAlert, ShieldCheck } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { verifyCredential, verifyPublicCredential } from "../../services/api/verifications.api.js";
import { Alert, Button, Card, CardDivider, Textarea } from "../../components/ui/index.js";

function extractCredentialFromText(text) {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("Paste or upload a credential first.");

  if (/<!doctype html|<html/i.test(raw)) {
    const match = raw.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (!match?.[1]) throw new Error("This HTML card does not contain embedded credential data.");
    return JSON.parse(match[1]);
  }

  return JSON.parse(raw);
}

function formatDate(value) {
  if (!value) return "Not provided";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function CredentialVerifyPage() {
  const [searchParams] = useSearchParams();
  const verificationId = searchParams.get("id") || "";
  const [rawCredential, setRawCredential] = useState("");
  const [parseError, setParseError] = useState("");

  const publicVerification = useQuery({
    queryKey: ["public-credential-verification", verificationId],
    queryFn: () => verifyPublicCredential(verificationId),
    enabled: Boolean(verificationId),
  });

  const verifyMutation = useMutation({
    mutationFn: (credential) => verifyCredential(credential),
    onMutate: () => setParseError(""),
    onError: (err) => setParseError(err?.message || "Credential could not be verified."),
  });

  const result = publicVerification.data?.data || verifyMutation.data?.data;
  const displayError = parseError || publicVerification.error?.message;
  const skills = useMemo(() => result?.skills ?? [], [result]);

  function handleVerify() {
    try {
      const credential = extractCredentialFromText(rawCredential);
      verifyMutation.mutate(credential);
    } catch (err) {
      verifyMutation.reset();
      setParseError(err.message || "Credential must be valid JSON-LD or a NexusWork credential card.");
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // The downloadable credential card is a human-readable PDF. It does not
    // contain the signed JSON-LD payload needed for cryptographic verification.
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setRawCredential("");
      verifyMutation.reset();
      setParseError('This is the human-readable credential card PDF. Upload the student\'s separate “Signed VC” (.vc.jsonld) download to verify its signature.');
      event.target.value = "";
      return;
    }

    const text = await file.text();
    setRawCredential(text);
    try {
      verifyMutation.mutate(extractCredentialFromText(text));
    } catch (err) {
      verifyMutation.reset();
      setParseError(err.message || "Credential must be valid JSON-LD or a NexusWork credential card.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <section className="pt-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-brass">Credential verification</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-black leading-tight text-slate sm:text-5xl">
            Verify a NexusWork student credential.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Paste or upload a signed VC/Open Badge file. NexusWork checks the cryptographic
            proof and shows whether the credential is authentic and unchanged.
          </p>

          <div className="mt-8 grid gap-3 text-sm text-slate-300">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brass" aria-hidden="true" />
              <span>Confirms the credential was signed by the NexusWork issuer key.</span>
            </div>
            <div className="flex gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brass" aria-hidden="true" />
              <span>Detects tampering if the student name, university, skills, or dates were edited.</span>
            </div>
          </div>
        </section>

        <Card as="section" className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate">Credential input</h2>
              <p className="mt-1 text-sm text-slate-300">Scan the QR code on a credential card, or upload the signed `.vc.jsonld` export.</p>
            </div>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-control border border-ink-300 bg-ink-50 px-4 text-sm font-semibold text-slate transition hover:border-brass/40 hover:bg-ink-700">
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Upload file
              <input type="file" accept=".json,.jsonld,.vc,.pdf,application/json,application/ld+json,application/pdf" className="sr-only" onChange={handleFile} />
            </label>
            <p className="mt-2 text-xs text-slate-400">Allowed: JSON, JSON-LD, VC, or PDF credential files.</p>
          </div>

          <Textarea
            id="credential-json"
            label="Credential JSON-LD"
            rows={12}
            value={rawCredential}
            onChange={(event) => setRawCredential(event.target.value)}
            placeholder='Paste the downloaded ".vc.jsonld" credential here...'
            wrapperClassName="mt-5"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleVerify} loading={verifyMutation.isPending}>
              Verify credential
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setRawCredential("");
                setParseError("");
                verifyMutation.reset();
              }}
            >
              Clear
            </Button>
          </div>

          {(displayError || publicVerification.isLoading || result) && <CardDivider className="my-6" />}

          {publicVerification.isLoading && (
            <Alert title="Checking credential">Verifying this credential with NexusWork…</Alert>
          )}

          {displayError && !publicVerification.isLoading && (
            <Alert variant="danger" title="Verification failed">
              {displayError}
            </Alert>
          )}

          {result && (
            <div className="space-y-5">
              <Alert variant={result.valid ? "success" : "danger"} title={result.valid ? "Credential is authentic" : "Credential is not trusted"}>
                {result.reason}
              </Alert>

              {result.valid && result.studentId && (
                <Link
                  to={`/profile/${result.studentId}`}
                  className="inline-flex items-center justify-center rounded-control bg-brass px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-brass-300"
                >
                  View student profile and portfolio
                </Link>
              )}

              <div className="grid gap-3 rounded-card border border-ink-300 bg-ink p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-300">Student</p>
                  <p className="mt-1 font-bold text-slate">{result.subject || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-300">Issuer</p>
                  <p className="mt-1 font-bold text-slate">{result.issuer || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-300">Credential</p>
                  <p className="mt-1 font-bold text-slate">{result.credentialName || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-300">Issued</p>
                  <p className="mt-1 font-bold text-slate">{formatDate(result.issuedAt)}</p>
                </div>
              </div>

              {skills.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-300">Certified skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span key={`${skill.name}-${skill.level}`} className="rounded-full border border-brass/25 bg-brass/10 px-3 py-1 text-xs font-bold text-brass">
                        {skill.name}{skill.level ? ` · ${skill.level}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!result.valid && (
                <div className="flex gap-3 rounded-card border border-brick/30 bg-brick-100 p-4 text-sm text-slate">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brick" aria-hidden="true" />
                  <p>Do not rely on this credential until the student provides a valid export directly from NexusWork.</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
