import { Link } from "@tanstack/react-router";
import { authorName, formatDate, readingTime, type PostWithAuthor } from "@/lib/blog";

export function PostCard({ post, delay = 0 }: { post: PostWithAuthor; delay?: number }) {
  return (
    <article
      className="glass border border-border rounded-3xl overflow-hidden ring-1 ring-foreground/5 transition-transform duration-300 hover:-translate-y-1 animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      {post.featured_image ? (
        <img
          src={post.featured_image}
          alt={post.title}
          loading="lazy"
          className="w-full aspect-[16/10] object-cover"
        />
      ) : (
        <div className="w-full aspect-[16/10] bg-accent-soft grid place-items-center">
          <span className="eyebrow text-muted-foreground">{post.category}</span>
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 eyebrow text-muted-foreground">
          <span className="text-accent">{post.category}</span>
          <span>·</span>
          <span>{formatDate(post.created_at)}</span>
        </div>
        <h3 className="mt-3 font-display font-semibold text-lg tracking-tight text-balance">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-2 text-muted-foreground text-sm text-pretty line-clamp-3">
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-5 flex items-center justify-between text-sm gap-3">
          <span className="text-muted-foreground truncate">
            {authorName(post.author)} · {readingTime(post.content)}
          </span>
          <Link
            to="/blogs/$slug"
            params={{ slug: post.slug }}
            className="link-underline font-medium text-accent shrink-0"
          >
            Read more
          </Link>
        </div>
      </div>
    </article>
  );
}
