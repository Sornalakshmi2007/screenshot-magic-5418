import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-display text-lg font-semibold tracking-tight">Marginalia</span>
        <p className="text-sm text-muted-foreground">A reading room for the curious. © 2026</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/blogs" className="link-underline hover:text-foreground">
            Archive
          </Link>
          <Link to="/register" className="link-underline hover:text-foreground">
            Write with us
          </Link>
        </div>
      </div>
    </footer>
  );
}
