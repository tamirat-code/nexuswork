import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, User } from "lucide-react";
import { changePassword } from "../../services/api/auth.api.js";
import { updateMe } from "../../services/api/users.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Switch } from "../../components/ui/shadcn/switch.jsx";
import { Separator } from "../../components/ui/shadcn/separator.jsx";

export default function SettingsPage() {
  const { token, user, refreshMe } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(user?.notification_prefs?.email ?? true);
  const [pushNotifs, setPushNotifs] = useState(user?.notification_prefs?.push ?? true);

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
    <div className="mx-auto max-w-3xl animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Account</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Settings</h1>
        <p className="mt-2 text-sm text-slate-300">Manage your profile, security, and notification preferences.</p>
      </header>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-brass" /> Profile</CardTitle>
            <CardDescription>Your public name shown to clients and students.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Full name</Label>
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button size="sm" loading={profileMutation.isPending} onClick={() => profileMutation.mutate()}>Save profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-brass" /> Security</CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-current">Current password</Label>
              <Input id="settings-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-new">New password</Label>
              <Input id="settings-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <Button size="sm" variant="secondary" loading={passwordMutation.isPending} onClick={() => passwordMutation.mutate()}>Change password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brass" /> Notifications</CardTitle>
            <CardDescription>Choose how you hear about proposal, milestone, and dispute activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate">Email notifications</p>
                <p className="text-xs text-slate-300">Proposals received, milestone funded, payment released.</p>
              </div>
              <Switch
                checked={emailNotifs}
                onCheckedChange={(checked) => notificationsMutation.mutate({ email: checked, push: pushNotifs })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate">Push notifications</p>
                <p className="text-xs text-slate-300">Real-time alerts while you're signed in.</p>
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