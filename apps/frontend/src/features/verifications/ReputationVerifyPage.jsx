import { useState } from "react";
import { Activity, BadgeCheck, FileUp, ShieldAlert, ShieldCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { verifyReputation } from "../../services/api/reviews.api.js";
import { Alert, Button, Card, CardDivider, Textarea } from "../../components/ui/index.js";

function parseDocument(value) {
  const raw = String(value || "").trim();
  if (!raw) throw new Error("Paste or upload a reputation export first.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("The reputation export must be valid JSON.");
  }
}

function formatDate(value) {
  if (!value) return "Not provided";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ReputationVerifyPage() {
  const { t } = useTranslation();
  const [rawDocument, setRawDocument] = useState("");
  const [parseError, setParseError] = useState("");

  const verifyMutation = useMutation({
    mutationFn: (document) => verifyReputation(document),
    onMutate: () => setParseError(""),
  });

  const result = verifyMutation.data?.data;
  const error = parseError || verifyMutation.error?.message;

  function handleVerify() {
    try {
      verifyMutation.mutate(parseDocument(rawDocument));
    } catch (err) {
      verifyMutation.reset();
      setParseError(err.message || t("reputationVerification.invalidJson"));
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawDocument(text);
    try {
      verifyMutation.mutate(parseDocument(text));
    } catch (err) {
      verifyMutation.reset();
      setParseError(err.message || t("reputationVerification.invalidJson"));
    } finally {
      event.target.value = "";
    }
  }

  function clear() {
    setRawDocument("");
    setParseError("");
    verifyMutation.reset();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="pt-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-brass">
            {t("reputationVerification.eyebrow")}
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-black leading-tight text-slate sm:text-5xl">
            {t("reputationVerification.title")}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            {t("reputationVerification.subtitle")}
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-300">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brass" aria-hidden="true" />
              <span>{t("reputationVerification.signatureCheck")}</span>
            </div>
            <div className="flex gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brass" aria-hidden="true" />
              <span>{t("reputationVerification.summaryCheck")}</span>
            </div>
          </div>
        </section>

        <Card as="section" className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate">{t("reputationVerification.inputTitle")}</h2>
              <p className="mt-1 text-sm text-slate-300">{t("reputationVerification.inputDescription")}</p>
            </div>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-control border border-ink-300 bg-ink-50 px-4 text-sm font-semibold text-slate transition hover:border-brass/40 hover:bg-ink-700">
              <FileUp className="h-4 w-4" aria-hidden="true" />
              {t("reputationVerification.upload")}
              <input type="file" accept=".json,application/json" className="sr-only" onChange={handleFile} />
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-400">{t("reputationVerification.allowed")}</p>

          <Textarea
            id="reputation-json"
            label={t("reputationVerification.jsonLabel")}
            rows={12}
            value={rawDocument}
            onChange={(event) => setRawDocument(event.target.value)}
            placeholder={t("reputationVerification.placeholder")}
            wrapperClassName="mt-5"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleVerify} loading={verifyMutation.isPending}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {t("reputationVerification.verify")}
            </Button>
            <Button variant="secondary" onClick={clear}>{t("reputationVerification.clear")}</Button>
          </div>

          {(error || verifyMutation.isPending || result) && <CardDivider className="my-6" />}
          {verifyMutation.isPending && <Alert title={t("reputationVerification.checking")}>{t("reputationVerification.checkingDescription")}</Alert>}
          {error && !verifyMutation.isPending && <Alert variant="danger" title={t("reputationVerification.failed")}>{error}</Alert>}

          {result && (
            <div className="space-y-5">
              <Alert variant={result.valid ? "success" : "danger"} title={result.valid ? t("reputationVerification.authentic") : t("reputationVerification.notAuthentic")}>
                {result.reason}
              </Alert>

              <div className="grid gap-3 rounded-card border border-ink-300 bg-ink p-4 text-sm sm:grid-cols-2">
                <div><p className="text-xs font-extrabold uppercase tracking-widest text-slate-300">{t("reputationVerification.subject")}</p><p className="mt-1 break-all font-bold text-slate">{result.subject || "Not provided"}</p></div>
                <div><p className="text-xs font-extrabold uppercase tracking-widest text-slate-300">{t("reputationVerification.issuer")}</p><p className="mt-1 font-bold text-slate">{result.issuer || "Not provided"}</p></div>
                <div><p className="text-xs font-extrabold uppercase tracking-widest text-slate-300">{t("reputationVerification.issued")}</p><p className="mt-1 font-bold text-slate">{formatDate(result.issuedAt)}</p></div>
                <div><p className="text-xs font-extrabold uppercase tracking-widest text-slate-300">{t("reputationVerification.version")}</p><p className="mt-1 font-bold text-slate">{result.version || "Not provided"}</p></div>
              </div>

              {result.valid && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric icon={Activity} label={t("reputationVerification.ratings")} value={result.ratings ?? 0} />
                  <Metric icon={Activity} label={t("reputationVerification.deliveryMetrics")} value={result.deliveryMetrics ?? 0} />
                  <Metric icon={BadgeCheck} label={t("reputationVerification.credentials")} value={result.credentials ?? 0} />
                </div>
              )}

              {!result.valid && (
                <div className="flex gap-3 rounded-card border border-brick/30 bg-brick-100 p-4 text-sm text-slate">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brick" aria-hidden="true" />
                  <p>{t("reputationVerification.warning")}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-card border border-ink-300 bg-ink-50 p-4">
      <Icon className="h-5 w-5 text-brass" aria-hidden="true" />
      <p className="mt-3 text-2xl font-black text-slate">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-300">{label}</p>
    </div>
  );
}
