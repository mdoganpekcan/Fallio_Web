"use client";

import { loginAction } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";

const initialState = { error: null as string | null };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--panel)]/95 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_28%,transparent)] text-2xl">
          ✦
        </div>
        <p className="text-sm uppercase tracking-[0.2rem] text-[var(--muted-foreground)]">
          Fallio Admin
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white">
          Admin Panel Login
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Welcome back, please enter your details to login.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2 text-left">
          <label className="text-sm font-semibold text-white">
            Email Address
          </label>
          <Input
            required
            name="email"
            type="email"
            placeholder="admin@fallio.com"
            className="w-full"
          />
        </div>
        <div className="space-y-2 text-left">
          <label className="text-sm font-semibold text-white">Password</label>
          <Input
            required
            name="password"
            type="password"
            placeholder="Enter your password"
            className="w-full"
          />
          <div className="flex justify-end text-sm">
            <a
              className="text-[var(--accent)] hover:underline"
              href="mailto:destek@fallio.com?subject=Parola%20Sifirlama%20Talebi"
              aria-label="Forgot Password"
            >
              Forgot Password?
            </a>
          </div>
        </div>
        {state?.error ? (
          <p className="rounded-xl bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] px-3 py-2 text-sm text-[var(--danger)]">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" size="lg">
          Login
        </Button>
        <p className="text-center text-xs text-[var(--muted-foreground)]">
          © 2024 Falio. All rights reserved.
        </p>
      </form>
    </div>
  );
}
