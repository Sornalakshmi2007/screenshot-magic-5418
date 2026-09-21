import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/require-auth";
import { PostEditorFields, type PostDraft } from "@/components/post-editor";
import { slugify } from "@/lib/blog";

export const Route = createFileRoute("/new-post")({
  head: () => ({
    meta: [
      { title: "Write a new essay — Marginalia" },
      { name: "description", content: "Publish a new essay to the Marginalia archive." },
      { property: "og:title", content: "Write a new essay — Marginalia" },
      { property: "og:description", content: "Publish a new essay to Marginalia." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NewPost />
    </RequireAuth>
  ),
});

function NewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<PostDraft>({
    title: "",
    category: "General",
    featured_image: "",
    excerpt: "",
    content: "",
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({
          user_id: user!.id,
          title: draft.title.trim(),
          slug: slugify(draft.title),
          content: draft.content.trim(),
          excerpt: draft.excerpt.trim() || null,
          featured_image: draft.featured_image.trim() || null,
          category: draft.category,
        })
        .select("slug")
        .single();

      if (error) {
        toast.error(error.message);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["my-posts", user!.id] });
      toast.success("Essay published");
      navigate({ to: "/blogs/$slug", params: { slug: data.slug } });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-8 py-14 animate-rise">
      <p className="eyebrow text-accent mb-3">New essay</p>
      <h1 className="font-display font-semibold tracking-tight text-[clamp(1.9rem,4vw,2.75rem)]">
        Write something worth reading
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 glass border border-border rounded-3xl p-6">
        <PostEditorFields draft={draft} onChange={setDraft} />
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent text-accent-foreground font-medium rounded-full px-6 py-3 text-sm disabled:opacity-60"
          >
            {submitting ? "Publishing…" : "Publish essay"}
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
