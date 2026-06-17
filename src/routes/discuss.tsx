import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, Plus, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { randomNickname } from "@/lib/nicknames";

export const Route = createFileRoute("/discuss")({
  head: () => ({ meta: [{ title: "Discuss — FURSAD" }] }),
  component: DiscussPage,
});

type CatKey = "jobs" | "elder" | "safe" | "wins";

function DiscussPage() {
  const { t } = useI18n();
  const [cat, setCat] = useState<CatKey>("jobs");
  const [composeOpen, setComposeOpen] = useState(false);
  const [content, setContent] = useState("");
  const [composeCat, setComposeCat] = useState<CatKey>("jobs");
  const qc = useQueryClient();

  const posts = useQuery({
    queryKey: ["posts", cat],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_posts").select("*").eq("category", cat)
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error; return data ?? [];
    },
  });

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    const { data: blocked } = await supabase.rpc("is_content_blocked", { _text: text });
    if (blocked) {
      alert(t.discuss.blocked); return;
    }
    const { error } = await supabase.from("forum_posts").insert({
      nickname: randomNickname(), category: composeCat, content: text.slice(0, 2000),
    });
    if (error) { alert(t.common.postError); return; }
    setContent(""); setComposeOpen(false);
    qc.invalidateQueries({ queryKey: ["posts"] });
  };


  const upvote = async (id: string) => {
    await supabase.rpc("upvote_post", { post_id: id });
    qc.invalidateQueries({ queryKey: ["posts"] });
  };

  const catKeys = useMemo(() => ["jobs", "elder", "safe", "wins"] as CatKey[], []);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">{t.discuss.title}</h1>
        <button onClick={() => setComposeOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium">
          <Plus size={14} aria-hidden="true" /> {t.discuss.create}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {catKeys.map((k) => (
          <button key={k} onClick={() => setCat(k)}
            className={`px-3 py-1.5 rounded-full text-sm ${cat === k ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
            {t.discuss.categories[k]}
          </button>
        ))}
      </div>

      {composeOpen && (
        <form onSubmit={submitPost} className="card-elevated p-3 mb-4 space-y-2">
          <select value={composeCat} onChange={(e) => setComposeCat(e.target.value as CatKey)} className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm">
            {catKeys.map((k) => <option key={k} value={k}>{t.discuss.categories[k]}</option>)}
          </select>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} maxLength={2000}
            placeholder={t.discuss.placeholder}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm resize-y" />
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium">
            <Send size={14} aria-hidden="true" /> {t.discuss.post}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {posts.isLoading && <p className="text-sm text-muted-foreground">{t.common.loading}</p>}
        {!posts.isLoading && posts.data?.length === 0 && <p className="text-sm text-muted-foreground">{t.discuss.noPosts}</p>}
        {posts.data?.map((p) => (
          <article key={p.id} className="card-elevated p-4">
            <header className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{p.nickname}</span>
              <span>{new Date(p.created_at).toLocaleString()}</span>
            </header>
            <p className="mt-2 text-sm text-foreground whitespace-pre-line">{p.content}</p>
            <div className="mt-3 flex gap-3">
              <button onClick={() => upvote(p.id)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                <ThumbsUp size={14} aria-hidden="true" /> {p.upvotes}
              </button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
