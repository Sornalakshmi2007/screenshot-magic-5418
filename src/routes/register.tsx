import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create an account — Marginalia" },
      {
        name: "description",
        content: "Create a Marginalia account to publish essays and comment on other writers.",
      },
      { property: "og:title", content: "Create an account — Marginalia" },
      {
        property: "og:description",
        content: "Join Marginalia to publish essays and join discussions.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    if (password.length < 8) {
      toast.error("Use a password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: fullName.trim() },
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Account created — welcome to Marginalia");
      if (data.session) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/login" });
      }
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
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-md px-5 sm:px-8 py-16 animate-rise">
      <p className="eyebrow text-accent mb-3">Join the margin</p>
      <h1 className="font-display font-semibold text-3xl tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Already a member?{" "}
        <Link to="/login" className="link-underline text-accent font-medium">
          Log in
        </Link>
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 glass border border-border rounded-3xl p-6 space-y-4"
      >
        <Field label="Full name">
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            className="w-full bg-surface/70 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
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
            autoComplete="new-password"
            className="w-full bg-surface/70 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Confirm password">
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            className="w-full bg-surface/70 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent text-accent-foreground font-medium rounded-full px-6 py-3 text-sm disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
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
