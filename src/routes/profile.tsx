import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/require-auth";
import { fetchProfile, formatDate } from "@/lib/blog";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Marginalia" },
      { name: "description", content: "Update the name and avatar readers see on your essays." },
      { property: "og:title", content: "Your profile — Marginalia" },
      { property: "og:description", content: "Update your Marginalia author profile." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
});

function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user!.id],
    queryFn: () => fetchProfile(user!.id),
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!fullName.trim()) {
      toast.error("Your name can't be empty.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), avatar_url: avatarUrl.trim() || null })
        .eq("user_id", user!.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["profile", user!.id] });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Profile updated");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full bg-surface/70 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="mx-auto max-w-2xl px-5 sm:px-8 py-14 animate-rise">
      <p className="eyebrow text-accent mb-3">Your profile</p>
      <h1 className="font-display font-semibold tracking-tight text-[clamp(1.9rem,4vw,2.75rem)]">
        How readers see you
      </h1>

      {isLoading ? (
        <div className="mt-8 h-64 rounded-3xl glass border border-border animate-pulse" />
      ) : (
        <>
          <div className="mt-8 glass border border-border rounded-3xl p-6 flex items-center gap-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || "Your avatar"}
                className="size-16 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="size-16 rounded-full bg-accent-soft grid place-items-center font-display text-xl font-semibold">
                {(fullName || user?.email || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display font-semibold text-xl tracking-tight truncate">
                {fullName || "Unnamed writer"}
              </p>
              <p className="text-sm text-muted-foreground truncate">{profile?.email ?? user?.email}</p>
              {profile ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Member since {formatDate(profile.created_at)}
                </p>
              ) : null}
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-6 glass border border-border rounded-3xl p-6 space-y-4">
            <label className="block">
              <span className="eyebrow text-muted-foreground">Full name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground">Avatar URL</span>
              <input
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://…"
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-accent-foreground font-medium rounded-full px-6 py-3 text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
