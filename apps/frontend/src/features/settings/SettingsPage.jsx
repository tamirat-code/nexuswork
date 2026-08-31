import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, User } from "lucide-react";
import { changePassword, initiateMfaSetup } from "../../services/api/auth.api.js";
import { updateMe } from "../../services/api/users.api.js";
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
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">{t("settings.eyebrow")}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">{t("settings.title")}</h1>
        <p className="mt-2 text-sm text-slate-300">{t("settings.subtitle")}</p>
      </header>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-brass" /> {t("settings.profileCardTitle")}</CardTitle>
            <CardDescription>{t("settings.profileCardDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">{t("settings.fullName")}</Label>
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {profileError && <p className="text-xs text-brick" role="alert">{profileError}</p>}
            <Button size="sm" loading={profileMutation.isPending} onClick={() => { const value = name.trim(); if (!value || value.length > 120) { const message = "Name is required and must be 120 characters or fewer."; setProfileError(message); reportValidation(message, { form: "settings-profile", field: "name" }); return; } setProfileError(""); profileMutation.mutate(); }}>{t("settings.saveProfile")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-brass" /> {t("settings.securityCardTitle")}</CardTitle>
            <CardDescription>{t("settings.securityCardDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-current">{t("settings.currentPassword")}</Label>
              <PasswordInput id="settings-current" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-new">{t("settings.newPassword")}</Label>
              <PasswordInput id="settings-new" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            {passwordError && <p className="text-xs text-brick" role="alert">{passwordError}</p>}
            <Button size="sm" variant="secondary" loading={passwordMutation.isPending} onClick={() => { const issue = !currentPassword.trim() ? "Enter your current password." : passwordIssue(newPassword); if (issue) { setPasswordError(issue); reportValidation(issue, { form: "settings-password" }); return; } setPasswordError(""); passwordMutation.mutate(); }}>{t("settings.changePassword")}</Button>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate">{t("settings.mfaTitle")}</p>
                <p className="text-xs text-slate-300">
                  {user?.mfa_enabled
                    ? t("settings.mfaEnabledDesc")
                    : t("settings.mfaDisabledDesc")}
                </p>
              </div>
              {user?.mfa_enabled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/30 bg-brass/10 px-3 py-1 text-xs font-semibold text-brass">
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
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brass" /> {t("settings.notificationsTitle")}</CardTitle>
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

