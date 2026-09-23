import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckCircle2, PlugZap, SendHorizonal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/shadcn/select.jsx";
import { submitPartnerApplication } from "../../services/api/partner.api.js";
import { useAuth } from "../../hooks/useAuth.js";

const TIERS = ["sandbox", "growth", "enterprise"];
const ALL_SCOPES = ["talent:read", "talent:export", "usage:read", "webhooks:manage"];

const TIER_DESCRIPTIONS = {
  sandbox: "Free tier for testing and development. Lower rate limits and monthly quota.",
  growth: "For growing integrations with moderate usage needs.",
  enterprise: "High quota, high rate limits for production enterprise integrations.",
};

const SCOPE_DESCRIPTIONS = {
  "talent:read": "Search verified, opted-in student profiles",
  "talent:export": "Export student profile data (requires talent:read)",
  "usage:read": "Read your own API usage and billing statements",
  "webhooks:manage": "Create and manage webhook subscriptions",
};

function ScopeCheckbox({ scope, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle bg-surface-soft/60 px-4 py-3 transition hover:border-brand/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-brass"
      />
      <div>
        <p className="text-sm font-medium text-content-primary">{scope}</p>
        <p className="mt-0.5 text-xs text-content-secondary">{SCOPE_DESCRIPTIONS[scope]}</p>
      </div>
    </label>
  );
}

export default function PartnerApplyPage() {
  const { t } = useTranslation();
  const { user, token } = useAuth();

  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [tier, setTier] = useState("sandbox");
  const [scopes, setScopes] = useState(["talent:read", "usage:read"]);
  const [submitted, setSubmitted] = useState(false);

  const toggleScope = (scope, checked) => {
    setScopes((prev) =>
      checked ? [...prev, scope] : prev.filter((s) => s !== scope)
    );
  };

  const applyMutation = useMutation({
    mutationFn: () =>
      submitPartnerApplication(
        {
          name: name.trim(),
          organization_name: organizationName.trim() || undefined,
          contact_email: contactEmail.trim(),
          tier,
          scopes,
        },
        token
      ),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error) => {
      if (error.code === "API_PARTNER_APPLICATION_EXISTS") {
        toast.info(
          t("partnerApply.alreadySubmitted", {
            defaultValue:
              "An application for this contact email is already pending review.",
          })
        );
      } else {
        toast.error(error.message || t("partnerApply.submitError", { defaultValue: "Could not submit application" }));
      }
    },
  });

  const canSubmit =
    name.trim().length >= 2 &&
    contactEmail.trim().length > 0 &&
    scopes.length > 0;

  if (submitted) {
    return (
      <div className="mx-auto mt-24 max-w-lg px-4 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-teal" />
        <h1 className="mt-6 font-display text-3xl text-content-primary">
          {t("partnerApply.successTitle", { defaultValue: "Application submitted" })}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-content-secondary">
          {t("partnerApply.successBody", {
            defaultValue:
              "Our team will review your application and send your initial API key to the contact email you provided. This usually takes 1–2 business days.",
          })}
        </p>
        <p className="mt-2 text-xs text-content-secondary">
          {t("partnerApply.successEmail", { defaultValue: "Confirmation sent to:" })}{" "}
          <strong className="text-content-primary">{contactEmail}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="border-b border-border-subtle pb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
          {t("partnerApply.eyebrow", { defaultValue: "Enterprise Talent API" })}
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-content-primary">
          {t("partnerApply.title", { defaultValue: "Apply for API access" })}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-content-secondary">
          {t("partnerApply.subtitle", {
            defaultValue:
              "Submit an application to integrate with the NexusWork Talent API. Your application will be reviewed by an administrator before your initial key is issued.",
          })}
        </p>
      </header>

      <div className="mt-8 space-y-6">
        {/* Partner identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlugZap className="h-4 w-4 text-brand" />
              {t("partnerApply.identityTitle", { defaultValue: "Partner identity" })}
            </CardTitle>
            <CardDescription>
              {t("partnerApply.identityDesc", { defaultValue: "Tell us about your integration and organisation." })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="apply-name">
                {t("partnerApply.integrationName", { defaultValue: "Integration name" })}
                <span className="ml-1 text-danger">*</span>
              </Label>
              <Input
                id="apply-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                placeholder={t("partnerApply.integrationNamePlaceholder", { defaultValue: "e.g. Acme Hiring Platform" })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apply-org">
                {t("partnerApply.organizationName", { defaultValue: "Organisation name" })}
              </Label>
              <Input
                id="apply-org"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                maxLength={200}
                placeholder={t("partnerApply.organizationNamePlaceholder", { defaultValue: "Optional legal entity name" })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apply-email">
                {t("partnerApply.contactEmail", { defaultValue: "Contact email" })}
                <span className="ml-1 text-danger">*</span>
              </Label>
              <Input
                id="apply-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="api@yourcompany.com"
              />
              <p className="text-xs text-content-secondary">
                {t("partnerApply.contactEmailHint", { defaultValue: "Your initial API key will be sent here when approved." })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tier selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t("partnerApply.tierTitle", { defaultValue: "Access tier" })}</CardTitle>
            <CardDescription>
              {t("partnerApply.tierDesc", { defaultValue: "Choose the tier that matches your expected usage. Admins can adjust this after review." })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("partnerApply.tier", { defaultValue: "Tier" })}</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((value) => (
                    <SelectItem key={value} value={value}>
                      <span className="capitalize">{value}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {TIER_DESCRIPTIONS[tier] && (
                <p className="text-xs text-content-secondary">{TIER_DESCRIPTIONS[tier]}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scope selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t("partnerApply.scopesTitle", { defaultValue: "Requested scopes" })}</CardTitle>
            <CardDescription>
              {t("partnerApply.scopesDesc", { defaultValue: "Select only the permissions your integration requires. You must request at least one scope." })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ALL_SCOPES.map((scope) => (
                <ScopeCheckbox
                  key={scope}
                  scope={scope}
                  checked={scopes.includes(scope)}
                  onChange={(checked) => toggleScope(scope, checked)}
                />
              ))}
            </div>
            {scopes.length === 0 && (
              <p className="mt-3 text-xs text-danger" role="alert">
                {t("partnerApply.scopeRequired", { defaultValue: "Select at least one scope." })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface-soft p-5">
          <p className="text-xs leading-relaxed text-content-secondary">
            {t("partnerApply.reviewNotice", {
              defaultValue:
                "Applications are reviewed manually. Student data access is only granted to verified, approved partners who agree to the NexusWork Data Processing Agreement.",
            })}
          </p>
          <Button
            disabled={!canSubmit}
            loading={applyMutation.isPending}
            onClick={() => applyMutation.mutate()}
            className="shrink-0"
          >
            <SendHorizonal className="mr-2 h-4 w-4" />
            {t("partnerApply.submit", { defaultValue: "Submit application" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
