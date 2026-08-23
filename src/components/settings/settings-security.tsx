"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changePassword } from "@/server/actions/settings";
import type { ChangePasswordInput } from "@/lib/validations";

export function SettingsSecurity() {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = e.currentTarget;
    const f = new FormData(form);
    const payload: ChangePasswordInput = {
      currentPassword: String(f.get("currentPassword")),
      newPassword: String(f.get("newPassword")),
      confirmPassword: String(f.get("confirmPassword")),
    };
    setSaving(true);
    const res = await changePassword(payload);
    setSaving(false);
    if (!res.ok) {
      if (res.fieldErrors) setErrors(Object.fromEntries(Object.entries(res.fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""])));
      return toast.error(res.error ?? "Could not change password.");
    }
    toast.success("Password changed");
    form.reset();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Use at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="max-w-sm space-y-4">
            <Field id="currentPassword" label="Current password" error={errors.currentPassword} />
            <Field id="newPassword" label="New password" error={errors.newPassword} />
            <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword} />
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Update password"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>Sign out of this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>Log out</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ id, label, error }: { id: string; label: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type="password" autoComplete="new-password" required />
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
