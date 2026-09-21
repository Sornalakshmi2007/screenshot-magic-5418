import { CATEGORIES } from "@/lib/blog";

export type PostDraft = {
  title: string;
  category: string;
  featured_image: string;
  excerpt: string;
  content: string;
};

export function PostEditorFields({
  draft,
  onChange,
}: {
  draft: PostDraft;
  onChange: (next: PostDraft) => void;
}) {
  const set = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const inputClass =
    "w-full bg-surface/70 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      <Label text="Title">
        <input
          value={draft.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder="What is this essay called?"
          className={inputClass}
        />
      </Label>
      <div className="grid sm:grid-cols-2 gap-4">
        <Label text="Category">
          <select
            value={draft.category}
            onChange={(event) => set("category", event.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Label>
        <Label text="Featured image URL (optional)">
          <input
            value={draft.featured_image}
            onChange={(event) => set("featured_image", event.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </Label>
      </div>
      <Label text="Excerpt (optional)">
        <textarea
          value={draft.excerpt}
          onChange={(event) => set("excerpt", event.target.value)}
          rows={3}
          placeholder="One or two sentences that pull the reader in."
          className={`${inputClass} resize-y`}
        />
      </Label>
      <Label text="Content">
        <textarea
          value={draft.content}
          onChange={(event) => set("content", event.target.value)}
          rows={14}
          placeholder="Write your essay…"
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </Label>
    </div>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-foreground">{text}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
