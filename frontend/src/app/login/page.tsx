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
    <main className="min-h-screen bg-surface-muted text-slate-950">
      <div className="flex h-12 items-center border-b border-grid-border bg-white px-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">
            ERATEX OPS CONTROL
          </p>
          <h1 className="text-sm font-semibold leading-5">Sign in</h1>
        </div>
      </div>
      <div className="grid min-h-[calc(100vh-48px)] gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="ops-panel overflow-hidden">
          <div className="border-b border-grid-border px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">
              Access queue
            </p>
            <h2 className="text-sm font-semibold">Readiness surfaces</h2>
          </div>
          <table className="ops-grid">
            <thead>
              <tr>
                <th>Surface</th>
                <th>Gate</th>
                <th>State</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Orders</td>
                <td>Lifecycle</td>
                <td>READY</td>
                <td>Planner</td>
              </tr>
              <tr>
                <td>PCD Readiness</td>
                <td>Cutting release</td>
                <td>BLOCKED</td>
                <td>Planning Head</td>
              </tr>
              <tr>
                <td>Fabric QC</td>
                <td>Inspection proof</td>
                <td>WATCH</td>
                <td>QC Lead</td>
              </tr>
            </tbody>
          </table>
        </section>
        <form onSubmit={handleSubmit} className="ops-panel self-start p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">
          Session Authentication
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">Credential Gate</h2>
        <p className="mt-1 text-[13px] leading-[18px] text-slate-600">Use seeded local credentials for validation.</p>
        <label className="mt-5 block text-sm font-medium text-slate-700">
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1 h-8 w-full rounded border border-grid-border px-3 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            autoComplete="username"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 h-8 w-full rounded border border-grid-border px-3 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            type="password"
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="ops-button ops-button-primary mt-5 w-full justify-center disabled:opacity-60"
        >
          {isSubmitting ? "Signing in" : "Sign in"}
        </button>
      </form>
      </div>
    </main>
  );
}
