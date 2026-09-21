import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CATEGORIES,
  authorName,
  fetchPosts,
  formatDate,
  readingTime,
  type PostWithAuthor,
} from "@/lib/blog";
import { PostCard } from "@/components/post-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marginalia — notes from the margin of modern life" },
      {
        name: "description",
        content:
          "Essays on design, technology, culture and craft. Read the latest writing or publish your own on Marginalia.",
      },
      { property: "og:title", content: "Marginalia — notes from the margin of modern life" },
      {
        property: "og:description",
        content: "Essays on design, technology, culture and craft, written slowly and edited carefully.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (posts ?? []).filter((post) => {
      const matchesCategory = category === "All" || post.category === category;
      const matchesTerm =
        !term ||
        post.title.toLowerCase().includes(term) ||
        (post.excerpt ?? "").toLowerCase().includes(term) ||
        post.content.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [posts, search, category]);

  const [featured, ...rest] = filtered;

  return (
    <main className="mx-auto max-w-6xl px-5 sm:px-8">
      <section className="pt-14 pb-10 animate-rise">
        <p className="eyebrow text-accent mb-4">Community essays · 2026</p>
        <h1 className="font-display font-semibold tracking-tight text-balance text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98] max-w-[16ch]">
          Notes from the <span className="italic text-accent">margin</span> of modern life
        </h1>
        <p className="mt-5 text-muted-foreground text-pretty max-w-[52ch] text-lg">
          Essays on design, technology, and the quiet craft of reading — written slowly, edited
          carefully.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="glass-strong border border-border rounded-full flex items-center gap-3 px-5 py-3 flex-1">
            <span className="font-mono text-muted-foreground text-sm">/</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search essays, authors, topics…"
              aria-label="Search essays"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground/70"
            />
          </div>
          <Link
            to="/blogs"
            className="bg-accent text-accent-foreground font-medium rounded-full px-6 py-3 text-sm text-center hover:opacity-90 transition-opacity"
          >
            Browse all
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={
                item === category
                  ? "text-sm font-medium bg-foreground text-background px-4 py-1.5 rounded-full"
                  : "text-sm text-muted-foreground hover:text-foreground px-4 py-1.5 rounded-full border border-border bg-surface/40"
              }
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <section className="pb-14 grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 rounded-3xl glass border border-border animate-pulse" />
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="h-36 rounded-3xl glass border border-border animate-pulse" />
            <div className="h-36 rounded-3xl glass border border-border animate-pulse" />
          </div>
        </section>
      ) : error ? (
        <EmptyState
          title="We couldn't load the essays"
          body="Something went wrong reaching the library. Please refresh and try again."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No essays here yet"
          body="Nothing matches this search yet. Be the first to publish something worth reading."
        />
      ) : (
        <>
          <section className="pb-14">
            <div className="grid lg:grid-cols-12 gap-6">
              <FeaturedPost post={featured!} />
              <div className="lg:col-span-5 flex flex-col gap-6">
                {rest.slice(0, 2).map((post, index) => (
                  <SidePost key={post.id} post={post} delay={140 + index * 60} />
                ))}
              </div>
            </div>
          </section>

          {rest.length > 2 ? (
            <section className="pb-16">
              <div className="flex items-end justify-between mb-6">
                <h2 className="font-display font-semibold text-2xl tracking-tight">Latest essays</h2>
                <span className="eyebrow text-muted-foreground">{filtered.length} articles</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.slice(2, 8).map((post, index) => (
                  <PostCard key={post.id} post={post} delay={120 + index * 60} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}

function FeaturedPost({ post }: { post: PostWithAuthor }) {
  return (
    <article className="lg:col-span-7 glass border border-border rounded-3xl overflow-hidden ring-1 ring-foreground/5 transition-transform duration-300 hover:-translate-y-1 animate-rise [animation-delay:80ms]">
      <div className="relative">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full aspect-[16/10] object-cover"
          />
        ) : (
          <div className="w-full aspect-[16/10] bg-accent-soft grid place-items-center">
            <span className="eyebrow text-muted-foreground">{post.category}</span>
          </div>
        )}
        <span className="absolute top-4 left-4 bg-accent text-accent-foreground text-xs font-medium px-3 py-1 rounded-full">
          Featured
        </span>
      </div>
      <div className="p-7">
        <div className="flex items-center gap-3 eyebrow text-muted-foreground">
          <span className="text-accent">{post.category}</span>
          <span>·</span>
          <span>{formatDate(post.created_at)}</span>
        </div>
        <h2 className="mt-3 font-display font-semibold text-3xl tracking-tight text-balance">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="mt-3 text-muted-foreground text-pretty">{post.excerpt}</p>
        ) : null}
        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{authorName(post.author)}</span>
          <Link
            to="/blogs/$slug"
            params={{ slug: post.slug }}
            className="link-underline text-sm font-medium text-accent"
          >
            Read more
          </Link>
        </div>
      </div>
    </article>
  );
}

function SidePost({ post, delay }: { post: PostWithAuthor; delay: number }) {
  return (
    <article
      className="glass border border-border rounded-3xl p-6 ring-1 ring-foreground/5 transition-transform duration-300 hover:-translate-y-1 animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 eyebrow text-muted-foreground">
        <span className="text-accent">{post.category}</span>
        <span>·</span>
        <span>{formatDate(post.created_at)}</span>
      </div>
      <h3 className="mt-3 font-display font-semibold text-xl tracking-tight text-balance">
        <Link to="/blogs/$slug" params={{ slug: post.slug }}>
          {post.title}
        </Link>
      </h3>
      {post.excerpt ? (
        <p className="mt-2 text-muted-foreground text-sm text-pretty line-clamp-2">
          {post.excerpt}
        </p>
      ) : null}
      <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{authorName(post.author)}</span>
        <span>·</span>
        <span>{readingTime(post.content)}</span>
      </div>
    </article>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="pb-20">
      <div className="glass border border-border rounded-3xl p-10 text-center">
        <h2 className="font-display font-semibold text-2xl tracking-tight">{title}</h2>
        <p className="mt-3 text-muted-foreground max-w-[46ch] mx-auto text-pretty">{body}</p>
        <Link
          to="/new-post"
          className="mt-6 inline-flex bg-accent text-accent-foreground font-medium rounded-full px-6 py-3 text-sm"
        >
          Write an essay
        </Link>
      </div>
    </section>
  );
}
