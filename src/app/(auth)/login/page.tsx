"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { LoadingOverlay } from "@/components/loading-overlay";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [loading, setLoading] = useState(false);
  // Set once credentials are accepted — drives the full-screen overlay while the
  // dashboard route loads. Kept separate from `loading` so a failed attempt never
  // flashes the "Taking you to your dashboard…" message.
  const [navigating, setNavigating] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false,
    });
    if (res?.error) {
      setLoading(false);
      toast.error("Invalid email or password.");
      return;
    }
    // Success — show the overlay and hold it until the dashboard unmounts this page.
    setNavigating(true);
    router.push(callbackUrl);
    router.refresh();
  }

  const busy = loading || navigating;

  return (
    <>
      {navigating && <LoadingOverlay label="Taking you to your dashboard…" />}
      <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Expense Manager account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <>
                <Spinner className="h-4 w-4" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New to Expense Manager?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
        </p>
        <p className="mt-3 rounded-md bg-muted/50 p-2 text-center text-xs text-muted-foreground">
          Demo: <span className="font-medium">demo@expensemanagerde.in</span> / <span className="font-medium">demo1234</span>
        </p>
      </CardContent>
    </Card>
    </>
  );
}
