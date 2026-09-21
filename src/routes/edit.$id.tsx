import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/require-auth";
import { PostEditorFields, type PostDraft } from "@/components/post-editor";
import { fetchPostById } from "@/lib/blog";

export const Route = createFileRoute("/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit essay — Marginalia" },
      { name: "description", content: "Revise one of your published Marginalia essays." },
      { property: "og:title", content: "Edit essay — Marginalia" },
      { property: "og:description", content: "Revise one of your Marginalia essays." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <EditPost />
    </RequireAuth>
  ),
});

function EditPost() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<PostDraft | null>(null);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post-by-id", id],
    queryFn: () => fetchPostById(id),
  });

  useEffect(() => {
    if (post && !draft) {
      setDraft({
        title: post.title,
        category: post.category,
        featured_image: post.featured_image ?? "",
        excerpt: post.excerpt ?? "",
        content: post.content,
      });
    }
  }, [post, draft]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-14">
        <div className="h-96 rounded-3xl glass border border-border animate-pulse" />
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-20 text-center">
        <h1 className="font-display font-semibold text-2xl tracking-tight">Essay not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted already.
        </p>
      </main>
    );
  }

  if (post.user_id !== user?.id) {
    return (
      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-20 text-center">
        <h1 className="font-display font-semibold text-2xl tracking-tight">
          You can only edit your own essays
        </h1>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-6 bg-accent text-accent-foreground rounded-full px-6 py-3 text-sm font-medium"
        >
          Back to dashboard
        </button>
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Give your essay a title.");
      return;
    }
    if (!draft.content.trim()) {
      toast.error("Your essay needs some content.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({
          title: draft.title.trim(),
          content: draft.content.trim(),
          excerpt: draft.excerpt.trim() || null,
          featured_image: draft.featured_image.trim() || null,
          category: draft.category,
        })
        .eq("id", id);

      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["post", post!.slug] });
      await queryClient.invalidateQueries({ queryKey: ["my-posts", user!.id] });
      toast.success("Changes saved");
      navigate({ to: "/blogs/$slug", params: { slug: post!.slug } });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-8 py-14 animate-rise">
      <p className="eyebrow text-accent mb-3">Revising</p>
      <h1 className="font-display font-semibold tracking-tight text-[clamp(1.9rem,4vw,2.75rem)]">
        Edit your essay
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 glass border border-border rounded-3xl p-6">
        {draft ? <PostEditorFields draft={draft} onChange={setDraft} /> : null}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent text-accent-foreground font-medium rounded-full px-6 py-3 text-sm disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="border border-border rounded-full px-6 py-3 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
