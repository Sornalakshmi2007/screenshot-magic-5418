import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  authorName,
  fetchComments,
  fetchPostBySlug,
  formatDate,
  readingTime,
  type CommentWithAuthor,
} from "@/lib/blog";

export const Route = createFileRoute("/blogs/$slug")({
  head: () => ({
    meta: [
      { title: "Essay — Marginalia" },
      { name: "description", content: "Read this essay and join the discussion on Marginalia." },
      { property: "og:title", content: "Essay — Marginalia" },
      {
        property: "og:description",
        content: "Read this essay and join the discussion on Marginalia.",
      },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => fetchPostBySlug(slug),
  });

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
        <h1 className="font-display font-semibold text-3xl tracking-tight">Essay not found</h1>
        <p className="mt-3 text-muted-foreground">
          This essay may have been removed by its author.
        </p>
        <Link
          to="/blogs"
          className="mt-6 inline-flex bg-accent text-accent-foreground font-medium rounded-full px-6 py-3 text-sm"
        >
          Back to all essays
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-8 py-14 animate-rise">
      <div className="flex items-center gap-3 eyebrow text-muted-foreground">
        <span className="text-accent">{post.category}</span>
        <span>·</span>
        <span>{formatDate(post.created_at)}</span>
        <span>·</span>
        <span>{readingTime(post.content)}</span>
      </div>
      <h1 className="mt-4 font-display font-semibold tracking-tight text-balance text-[clamp(2rem,5vw,3.25rem)] leading-[1.03]">
        {post.title}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        By <span className="font-medium text-foreground">{authorName(post.author)}</span>
      </p>

      {post.featured_image ? (
        <img
          src={post.featured_image}
          alt={post.title}
          className="mt-8 w-full aspect-[16/9] object-cover rounded-3xl border border-border"
        />
      ) : null}

      {post.excerpt ? (
        <p className="mt-8 text-lg text-muted-foreground text-pretty border-l-2 border-accent pl-5">
          {post.excerpt}
        </p>
      ) : null}

      <div className="mt-8 space-y-5 text-[1.05rem] leading-relaxed">
        {post.content.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index} className="text-pretty whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>

      {user?.id === post.user_id ? (
        <div className="mt-10 flex gap-3">
          <Link
            to="/edit/$id"
            params={{ id: post.id }}
            className="border border-border bg-surface/60 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            Edit essay
          </Link>
          <Link
            to="/dashboard"
            className="text-sm font-medium px-5 py-2.5 text-muted-foreground hover:text-foreground"
          >
            Go to dashboard
          </Link>
        </div>
      ) : null}

      <CommentsSection postId={post.id} />
    </main>
  );
}

function CommentsSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const { data: comments, isLoading, error } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["comments", postId] });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const { error: insertError } = await supabase
        .from("comments")
        .insert({ post_id: postId, user_id: user!.id, content });
      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      setDraft("");
      await invalidate();
      toast.success("Comment posted");
    },
    onError: () => toast.error("Could not post your comment. Please try again."),
  });

  const updateComment = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error: updateError } = await supabase
        .from("comments")
        .update({ content })
        .eq("id", id);
      if (updateError) throw updateError;
    },
    onSuccess: async () => {
      setEditingId(null);
      await invalidate();
      toast.success("Comment updated");
    },
    onError: () => toast.error("Could not update your comment."),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from("comments").delete().eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Could not delete your comment."),
  });

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="font-display font-semibold text-2xl tracking-tight">
        Comments {comments ? `(${comments.length})` : ""}
      </h2>

      {user ? (
        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) {
              toast.error("Write something before posting.");
              return;
            }
            addComment.mutate(draft.trim());
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            placeholder="Share what you thought…"
            aria-label="Write a comment"
            className="w-full glass border border-border rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          <button
            type="submit"
            disabled={addComment.isPending}
            className="mt-3 bg-accent text-accent-foreground font-medium rounded-full px-6 py-2.5 text-sm disabled:opacity-60"
          >
            {addComment.isPending ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <div className="mt-6 glass border border-border rounded-2xl p-5 text-sm text-muted-foreground">
          Please{" "}
          <Link to="/login" className="link-underline text-accent font-medium">
            log in
          </Link>{" "}
          to comment on this essay.
        </div>
      )}

      <div className="mt-8 space-y-4">
        {isLoading ? (
          <div className="h-24 rounded-2xl glass border border-border animate-pulse" />
        ) : error ? (
          <p className="text-sm text-destructive">We couldn't load the comments.</p>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              isOwner={user?.id === comment.user_id}
              isEditing={editingId === comment.id}
              editDraft={editDraft}
              onEditDraft={setEditDraft}
              onStartEdit={() => {
                setEditingId(comment.id);
                setEditDraft(comment.content);
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => {
                if (!editDraft.trim()) {
                  toast.error("Comment cannot be empty.");
                  return;
                }
                updateComment.mutate({ id: comment.id, content: editDraft.trim() });
              }}
              onDelete={() => deleteComment.mutate(comment.id)}
              busy={updateComment.isPending || deleteComment.isPending}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No comments yet — be the first to respond.
          </p>
        )}
      </div>
    </section>
  );
}

function CommentRow({
  comment,
  isOwner,
  isEditing,
  editDraft,
  onEditDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  busy,
}: {
  comment: CommentWithAuthor;
  isOwner: boolean;
  isEditing: boolean;
  editDraft: string;
  onEditDraft: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <article className="glass border border-border rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{authorName(comment.author)}</span>
        <span className="text-muted-foreground">· {formatDate(comment.created_at)}</span>
      </div>

      {isEditing ? (
        <div className="mt-3">
          <textarea
            value={editDraft}
            onChange={(event) => onEditDraft(event.target.value)}
            rows={3}
            aria-label="Edit comment"
            className="w-full bg-surface/70 border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={onSaveEdit}
              disabled={busy}
              className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-xs font-medium disabled:opacity-60"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="border border-border rounded-full px-4 py-2 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-pretty whitespace-pre-line">{comment.content}</p>
      )}

      {isOwner && !isEditing ? (
        <div className="mt-3 flex items-center gap-3 text-xs">
          <button onClick={onStartEdit} className="link-underline text-accent font-medium">
            Edit
          </button>
          {confirming ? (
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground">Delete this comment?</span>
              <button
                onClick={onDelete}
                disabled={busy}
                className="text-destructive font-medium disabled:opacity-60"
              >
                Yes, delete
              </button>
              <button onClick={() => setConfirming(false)} className="text-muted-foreground">
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="link-underline text-destructive font-medium"
            >
              Delete
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
}
