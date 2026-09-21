import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/70">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-9">
          <Link to="/" className="font-display text-[22px] font-semibold tracking-tight">
            Marginalia
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-foreground font-medium" }}
              className="link-underline hover:text-foreground"
            >
              Home
            </Link>
            <Link
              to="/blogs"
              activeProps={{ className: "text-foreground font-medium" }}
              className="link-underline hover:text-foreground"
            >
              Blogs
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                activeProps={{ className: "text-foreground font-medium" }}
                className="link-underline hover:text-foreground"
              >
                Dashboard
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/profile"
                className="link-underline text-sm text-muted-foreground hover:text-foreground px-3 py-2"
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="link-underline text-sm text-muted-foreground hover:text-foreground px-3 py-2"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2 text-foreground"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="md:hidden border-t border-border/70 glass-strong">
          <nav className="mx-auto max-w-6xl px-5 py-4 flex flex-col gap-1 text-sm">
            <Link to="/" onClick={() => setOpen(false)} className="py-3">
              Home
            </Link>
            <Link to="/blogs" onClick={() => setOpen(false)} className="py-3">
              Blogs
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="py-3">
                  Dashboard
                </Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="py-3">
                  Profile
                </Link>
                <button onClick={handleSignOut} className="py-3 text-left text-destructive">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="py-3">
                  Login
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="py-3">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
