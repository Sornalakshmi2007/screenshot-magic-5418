import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CATEGORIES, fetchPosts } from "@/lib/blog";
import { PostCard } from "@/components/post-card";

export const Route = createFileRoute("/blogs/")({
  head: () => ({
    meta: [
      { title: "All essays — Marginalia" },
      {
        name: "description",
        content:
          "Browse every essay on Marginalia. Search by title or content and filter by category.",
      },
      { property: "og:title", content: "All essays — Marginalia" },
      {
        property: "og:description",
        content: "Search and filter the full Marginalia archive of essays.",
      },
    ],
  }),
  component: BlogsPage,
});

const PAGE_SIZE = 9;

function BlogsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [visible, setVisible] = useState(PAGE_SIZE);

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
        post.content.toLowerCase().includes(term) ||
        (post.excerpt ?? "").toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [posts, search, category]);

  return (
    <main className="mx-auto max-w-6xl px-5 sm:px-8 py-14">
      <p className="eyebrow text-accent mb-4">The archive</p>
      <h1 className="font-display font-semibold tracking-tight text-balance text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.02]">
        Every essay, newest first
      </h1>

      <div className="mt-8 flex flex-col lg:flex-row gap-3">
        <div className="glass-strong border border-border rounded-full flex items-center gap-3 px-5 py-3 flex-1 max-w-xl">
          <span className="font-mono text-muted-foreground text-sm">/</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Search by title or content…"
            aria-label="Search essays"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((item) => (
            <button
              key={item}
              onClick={() => {
                setCategory(item);
                setVisible(PAGE_SIZE);
              }}
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
      </div>

      <div className="mt-10">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <div key={key} className="h-80 rounded-3xl glass border border-border animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="glass border border-border rounded-3xl p-10 text-center">
            <h2 className="font-display font-semibold text-xl">We couldn't load the archive</h2>
            <p className="mt-2 text-muted-foreground text-sm">Please refresh and try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass border border-border rounded-3xl p-10 text-center">
            <h2 className="font-display font-semibold text-2xl tracking-tight">
              Nothing here yet
            </h2>
            <p className="mt-3 text-muted-foreground max-w-[46ch] mx-auto text-pretty">
              No essays match this search. Try another topic, or publish the first one yourself.
            </p>
            <Link
              to="/new-post"
              className="mt-6 inline-flex bg-accent text-accent-foreground font-medium rounded-full px-6 py-3 text-sm"
            >
              Write an essay
            </Link>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.slice(0, visible).map((post, index) => (
                <PostCard key={post.id} post={post} delay={60 * (index % 6)} />
              ))}
            </div>
            {visible < filtered.length ? (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="border border-border bg-surface/60 rounded-full px-6 py-3 text-sm font-medium hover:bg-surface"
                >
                  Load more
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
