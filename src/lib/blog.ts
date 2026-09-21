import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = ["Design", "Technology", "Culture", "Craft", "General"] as const;

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type BlogPost = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type PostWithAuthor = BlogPost & { author: Profile | null };

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "post"}-${suffix}`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function readingTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

async function attachAuthors(posts: BlogPost[]): Promise<PostWithAuthor[]> {
  if (posts.length === 0) return [];
  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", userIds);
  const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p as Profile]));
  return posts.map((post) => ({ ...post, author: byUser.get(post.user_id) ?? null }));
}

export async function fetchPosts(): Promise<PostWithAuthor[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachAuthors((data ?? []) as BlogPost[]);
}

export async function fetchPostBySlug(slug: string): Promise<PostWithAuthor | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [withAuthor] = await attachAuthors([data as BlogPost]);
  return withAuthor ?? null;
}

export async function fetchPostById(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as BlogPost) ?? null;
}

export async function fetchMyPosts(userId: string): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BlogPost[];
}

export type CommentWithAuthor = Comment & { author: Profile | null };

export async function fetchComments(postId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const comments = (data ?? []) as Comment[];
  if (comments.length === 0) return [];
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", userIds);
  const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p as Profile]));
  return comments.map((c) => ({ ...c, author: byUser.get(c.user_id) ?? null }));
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export function authorName(profile: Profile | null) {
  if (!profile) return "Unknown author";
  return profile.full_name?.trim() || profile.email || "Unknown author";
}
