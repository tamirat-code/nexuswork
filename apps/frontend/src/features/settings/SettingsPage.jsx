import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, User } from "lucide-react";
import { changePassword, initiateMfaSetup } from "../../services/api/auth.api.js";
import { updateMe } from "../../services/api/users.api.js";
import { getTalentApiConsent, updateTalentApiConsent } from "../../services/api/students.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import PasswordInput from "../../components/ui/shadcn/password-input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Switch } from "../../components/ui/shadcn/switch.jsx";
import { Separator } from "../../components/ui/shadcn/separator.jsx";
import { passwordIssue, reportValidation } from "../../lib/validation.js";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { token, user, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(user?.notification_prefs?.email ?? true);
  const [pushNotifs, setPushNotifs] = useState(user?.notification_prefs?.push ?? true);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [talentApiEnabled, setTalentApiEnabled] = useState(false);
  const [talentApiFields, setTalentApiFields] = useState([]);
  const isGoogleAccount = user?.auth_provider === "google";
  const isStudent = user?.role === "student";

  const talentConsentQuery = useQuery({
    queryKey: ["talent-api-consent", token],
    queryFn: () => getTalentApiConsent(token),
    enabled: Boolean(token && isStudent),
  });

  useEffect(() => {
    const consent = talentConsentQuery.data?.data;
    if (!consent) return;
    setTalentApiEnabled(Boolean(consent.enabled));
    setTalentApiFields(consent.fields || []);
  }, [talentConsentQuery.data]);

  const talentConsentMutation = useMutation({
    mutationFn: () => updateTalentApiConsent({ enabled: talentApiEnabled, fields: talentApiFields }, token),
    onSuccess: ({ data }) => {
      setTalentApiEnabled(Boolean(data?.enabled));
      setTalentApiFields(data?.fields || []);
      toast.success(t("settings.talentConsentSaved"));
      talentConsentQuery.refetch();
    },
    onError: (err) => toast.error(err.message || t("settings.talentConsentError")),
  });

  const toggleTalentField = (field) => {
    setTalentApiFields((current) => current.includes(field)
      ? current.filter((value) => value !== field)
      : [...current, field]);
  };

  const profileMutation = useMutation({
    mutationFn: () => updateMe({ name }, token),
    onSuccess: () => toast.success("Profile updated"),
    onError: (err) => toast.error(err.message || "Could not update profile"),
  });

  const passwordMutation = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword, token),
    onSuccess: () => { setCurrentPassword(""); setNewPassword(""); toast.success("Password changed"); },
    onError: (err) => toast.error(err.message || "Could not change password"),
  });

  const mfaMutation = useMutation({
    mutationFn: () => initiateMfaSetup(token),
    onSuccess: ({ data }) => {
      navigate("/mfa/setup", {
        state: {
          setupToken: data.setupToken,
          secret: data.secret,
          otpauthUri: data.otpauthUri,
          returnTo: "/settings",
        },
      });
    },
    onError: (err) => toast.error(err.message || "Could not start MFA setup"),
  });

  const notificationsMutation = useMutation({
    mutationFn: (nextPrefs) => updateMe({ notification_prefs: nextPrefs }, token),
    onMutate: (nextPrefs) => {
      const previous = { email: emailNotifs, push: pushNotifs };
      setEmailNotifs(nextPrefs.email);
      setPushNotifs(nextPrefs.push);
      return { previous };
    },
    onSuccess: () => {
      refreshMe();
      toast.success("Notification preferences saved");
    },
    onError: (err, _nextPrefs, context) => {
      if (context?.previous) {
        setEmailNotifs(context.previous.email);
        setPushNotifs(context.previous.push);
      }
      toast.error(err.message || "Could not update notification preferences");
    },
  });

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-border-subtle pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{t("settings.eyebrow")}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-content-primary">{t("settings.title")}</h1>
        <p className="mt-2 text-sm text-content-secondary">{t("settings.subtitle")}</p>
      </header>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-brand" /> {t("settings.profileCardTitle")}</CardTitle>
            <CardDescription>{t("settings.profileCardDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">{t("settings.fullName")}</Label>
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {profileError && <p className="text-xs text-danger" role="alert">{profileError}</p>}
            <Button size="sm" loading={profileMutation.isPending} onClick={() => { const value = name.trim(); if (!value || value.length > 120) { const message = "Name is required and must be 120 characters or fewer."; setProfileError(message); reportValidation(message, { form: "settings-profile", field: "name" }); return; } setProfileError(""); profileMutation.mutate(); }}>{t("settings.saveProfile")}</Button>
          </CardContent>
        </Card>

        {isStudent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> {t("settings.talentConsentTitle")}</CardTitle>
              <CardDescription>{t("settings.talentConsentDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-surface-soft p-4">
                <div>
                  <p className="font-semibold text-content-primary">{t("settings.talentConsentToggle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-content-secondary">{t("settings.talentConsentToggleHint")}</p>
                </div>
                <Switch checked={talentApiEnabled} onCheckedChange={setTalentApiEnabled} disabled={talentConsentQuery.isLoading} />
              </div>

              <div>
                <p className="font-semibold text-content-primary">{t("settings.talentConsentFieldsTitle")}</p>
                <p className="mt-1 text-xs text-content-secondary">{t("settings.talentConsentFieldsHint")}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {["name", "skills", "verification", "institution", "program", "bio"].map((field) => (
                    <label key={field} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-subtle bg-surface-soft/70 px-3 py-2.5 text-sm text-content-primary transition hover:border-brand/50">
                      <input
                        type="checkbox"
                        checked={talentApiFields.includes(field)}
                        onChange={() => toggleTalentField(field)}
                        className="h-4 w-4 accent-brass"
                      />
                      <span>{t(`settings.talentFields.${field}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-ink-300 pt-4">
                <p className="max-w-xl text-xs leading-relaxed text-content-secondary">{t("settings.talentConsentPrivacy")}</p>
                <Button size="sm" loading={talentConsentMutation.isPending} onClick={() => talentConsentMutation.mutate()}>
                  {t("settings.saveTalentConsent")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-brand" /> {t("settings.securityCardTitle")}</CardTitle>
            <CardDescription>{t("settings.securityCardDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGoogleAccount && <p className="rounded-lg border border-brand/30 bg-brand-soft p-3 text-xs leading-relaxed text-content-secondary">{t("settings.googlePasswordHint", "You signed in with Google. Create a password here so you can also sign in with your email.")}</p>}
            {!isGoogleAccount && <div className="space-y-1.5">
              <Label htmlFor="settings-current">{t("settings.currentPassword")}</Label>
              <PasswordInput id="settings-current" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>}
            <div className="space-y-1.5">
              <Label htmlFor="settings-new">{t("settings.newPassword")}</Label>
              <PasswordInput id="settings-new" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            {passwordError && <p className="text-xs text-danger" role="alert">{passwordError}</p>}
            <Button size="sm" variant="secondary" loading={passwordMutation.isPending} onClick={() => { const issue = (!isGoogleAccount && !currentPassword.trim()) ? "Enter your current password." : passwordIssue(newPassword); if (issue) { setPasswordError(issue); reportValidation(issue, { form: "settings-password" }); return; } setPasswordError(""); passwordMutation.mutate(); }}>{isGoogleAccount ? t("settings.setPassword", "Set password") : t("settings.changePassword")}</Button>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-content-primary">{t("settings.mfaTitle")}</p>
                <p className="text-xs text-content-secondary">
                  {user?.mfa_enabled
                    ? t("settings.mfaEnabledDesc")
                    : t("settings.mfaDisabledDesc")}
                </p>
              </div>
              {user?.mfa_enabled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t("settings.mfaEnabledBadge")}
                </span>
              ) : (
                <Button size="sm" variant="secondary" loading={mfaMutation.isPending} onClick={() => mfaMutation.mutate()}>
                  {t("settings.enableMfaBtn")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> {t("settings.notificationsTitle")}</CardTitle>
            <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate">{t("settings.emailNotifsTitle")}</p>
                <p className="text-xs text-slate-300">{t("settings.emailNotifsDesc")}</p>
              </div>
              <Switch
                checked={emailNotifs}
                onCheckedChange={(checked) => notificationsMutation.mutate({ email: checked, push: pushNotifs })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate">{t("settings.pushNotifsTitle")}</p>
                <p className="text-xs text-slate-300">{t("settings.pushNotifsDesc")}</p>
              </div>
              <Switch
                checked={pushNotifs}
                onCheckedChange={(checked) => notificationsMutation.mutate({ email: emailNotifs, push: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
