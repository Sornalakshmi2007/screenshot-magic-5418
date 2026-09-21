import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Marginalia" },
      { name: "description", content: "Log in to write essays and join discussions on Marginalia." },
      { property: "og:title", content: "Log in — Marginalia" },
      { property: "og:description", content: "Log in to your Marginalia account." },
    ],
  }),
  component: LoginPage,
});

function readRedirect() {
  if (typeof window === "undefined") return "/dashboard";
  const value = new URLSearchParams(window.location.search).get("redirect");
  return value && value.startsWith("/") ? value : "/dashboard";
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Welcome back");
      navigate({ to: readRedirect() as never });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: readRedirect() as never });
  }

  return (
    <main className="mx-auto max-w-md px-5 sm:px-8 py-16 animate-rise">
      <p className="eyebrow text-accent mb-3">Welcome back</p>
      <h1 className="font-display font-semibold text-3xl tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/register" className="link-underline text-accent font-medium">
          Create an account
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 glass border border-border rounded-3xl p-6 space-y-4">
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="w-full bg-surface/70 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="w-full bg-surface/70 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent text-accent-foreground font-medium rounded-full px-6 py-3 text-sm disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full border border-border bg-surface/60 rounded-full px-6 py-3 text-sm font-medium"
        >
          Continue with Google
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
