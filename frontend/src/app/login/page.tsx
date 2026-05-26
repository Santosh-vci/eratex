"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/providers/AuthProvider";
import { ApiClientError } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("planner");
  const [password, setPassword] = useState("planning123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      router.push("/");
    } catch (caught) {
      if (caught instanceof ApiClientError) {
        setError(caught.errors[0]?.message ?? caught.message);
      } else {
        setError("Sign in failed.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface-muted p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-grid-border bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
          Eratex Phase 1
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Use seeded Phase 1 credentials for local validation.</p>
        <label className="mt-5 block text-sm font-medium text-slate-700">
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1 h-9 w-full border border-grid-border px-3 text-sm"
            autoComplete="username"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 h-9 w-full border border-grid-border px-3 text-sm"
            type="password"
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 h-9 w-full rounded bg-primary px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Signing in" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
