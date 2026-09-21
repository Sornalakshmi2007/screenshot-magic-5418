import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/require-auth";
import { fetchMyPosts, fetchProfile, formatDate, type BlogPost } from "@/lib/blog";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Marginalia" },
      { name: "description", content: "Manage the essays you've published on Marginalia." },
      { property: "og:title", content: "Your dashboard — Marginalia" },
      { property: "og:description", content: "Manage your Marginalia essays." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<BlogPost | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user!.id],
    queryFn: () => fetchProfile(user!.id),
  });

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["my-posts", user!.id],
    queryFn: () => fetchMyPosts(user!.id),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from("blog_posts").delete().eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["my-posts", user!.id] });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Essay deleted");
    },
    onError: () => toast.error("Could not delete that essay."),
  });

  const displayName = profile?.full_name?.trim() || user?.email || "writer";

  return (
    <main className="mx-auto max-w-5xl px-5 sm:px-8 py-14 animate-rise">
      <p className="eyebrow text-accent mb-3">Your desk</p>
      <h1 className="font-display font-semibold tracking-tight text-[clamp(1.9rem,4vw,2.75rem)] leading-tight">
        Welcome back, {displayName}
      </h1>

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <div className="glass border border-border rounded-3xl p-6">
          <p className="eyebrow text-muted-foreground">Total essays</p>
          <p className="mt-2 font-display font-semibold text-4xl">{posts?.length ?? 0}</p>
        </div>
        <div className="glass border border-border rounded-3xl p-6">
          <p className="eyebrow text-muted-foreground">Signed in as</p>
          <p className="mt-2 text-sm break-words">{user?.email}</p>
        </div>
        <div className="glass border border-border rounded-3xl p-6 flex flex-col justify-between gap-4">
          <p className="eyebrow text-muted-foreground">Start something</p>
          <Link
            to="/new-post"
            className="bg-accent text-accent-foreground font-medium rounded-full px-5 py-2.5 text-sm text-center"
          >
            Create new post
          </Link>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display font-semibold text-2xl tracking-tight">Recent posts</h2>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-24 rounded-2xl glass border border-border animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="mt-4 text-sm text-destructive">We couldn't load your essays.</p>
        ) : posts && posts.length > 0 ? (
          <div className="mt-6 space-y-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="glass border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="eyebrow text-muted-foreground flex items-center gap-2">
                    <span className="text-accent">{post.category}</span>
                    <span>·</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <h3 className="mt-1.5 font-display font-semibold text-lg tracking-tight truncate">
                    {post.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link
                    to="/blogs/$slug"
                    params={{ slug: post.slug }}
                    className="border border-border bg-surface/60 rounded-full px-4 py-2 text-xs font-medium"
                  >
                    View
                  </Link>
                  <Link
                    to="/edit/$id"
                    params={{ id: post.id }}
                    className="border border-border bg-surface/60 rounded-full px-4 py-2 text-xs font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setPendingDelete(post)}
                    className="border border-destructive/40 text-destructive rounded-full px-4 py-2 text-xs font-medium"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 glass border border-border rounded-3xl p-10 text-center">
            <h3 className="font-display font-semibold text-xl tracking-tight">
              You haven't published anything yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your first essay is the hardest. Start with a single paragraph.
            </p>
            <Link
              to="/new-post"
              className="mt-6 inline-flex bg-accent text-accent-foreground font-medium rounded-full px-6 py-3 text-sm"
            >
              Create new post
            </Link>
          </div>
        )}
      </section>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-5">
          <div className="glass-strong border border-border rounded-3xl p-7 max-w-sm w-full">
            <h3 className="font-display font-semibold text-xl tracking-tight">Delete this essay?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              “{pendingDelete.title}” and all of its comments will be permanently removed.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => deletePost.mutate(pendingDelete.id)}
                disabled={deletePost.isPending}
                className="bg-destructive text-destructive-foreground rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {deletePost.isPending ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                onClick={() => setPendingDelete(null)}
                className="border border-border rounded-full px-5 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
