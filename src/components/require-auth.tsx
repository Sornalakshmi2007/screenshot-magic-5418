import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: window.location.pathname } });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-20">
        <div className="h-64 rounded-3xl glass border border-border animate-pulse" />
      </main>
    );
  }

  return <>{children}</>;
}
