"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LogoFramework from "@/app/stack/logo-framework";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GithubIcon,
  Loading03Icon,
  Tick01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { Id } from "@/convex/_generated/dataModel";
import type { DetectedTool } from "@/lib/github/tool-map";

type StackData = FunctionReturnType<typeof api.stacks.getStack>;
type Section = StackData["sections"][number];

interface DetectResponse {
  repo?: { fullName: string; description: string | null };
  tools: DetectedTool[];
}

interface RepoEntry {
  fullName: string;
  name: string;
  private: boolean;
  pushedAt: string;
}

type RepoListState =
  | { status: "idle" | "loading" }
  | { status: "signed_out" }
  | { status: "not_connected" }
  | { status: "error" }
  | { status: "ready"; repos: RepoEntry[] };

export default function GithubImportDialog({
  sections,
}: {
  sections: Section[];
}) {
  const [open, setOpen] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [pasteInput, setPasteInput] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectResponse | null>(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const [repoList, setRepoList] = useState<RepoListState>({ status: "idle" });

  const getOrCreateTool = useMutation(api.tools.getOrCreateTool);
  const updateSectionTools = useMutation(api.stacks.updateSectionTools);

  const reset = () => {
    setRepoInput("");
    setPasteInput("");
    setError(null);
    setResult(null);
    setSourceLabel("");
    setExcluded(new Set());
    setDone(false);
    setRepoList({ status: "idle" });
  };

  const applyResult = (data: DetectResponse, label: string) => {
    setResult(data);
    setSourceLabel(label);
    setExcluded(new Set());
    setDone(false);
  };

  const detectRepo = async (repo: string) => {
    if (!repo.trim()) return;
    setIsDetecting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/github/detect?repo=${encodeURIComponent(repo.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Detection failed");
      applyResult(data as DetectResponse, data.repo?.fullName ?? repo.trim());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't analyze that repository"
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const detectPaste = async (content: string, fileName = "package.json") => {
    if (!content.trim()) return;
    setIsDetecting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/import/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't read that file");
      applyResult({ tools: data.tools }, fileName);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't read that file"
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const loadRepos = async () => {
    setRepoList({ status: "loading" });
    try {
      const res = await fetch("/api/github/repos");
      if (res.status === 401) return setRepoList({ status: "signed_out" });
      if (res.status === 409) return setRepoList({ status: "not_connected" });
      if (!res.ok) return setRepoList({ status: "error" });
      const data = await res.json();
      setRepoList({ status: "ready", repos: data.repos });
    } catch {
      setRepoList({ status: "error" });
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setPasteInput(text);
      void detectPaste(text, file.name);
    };
    reader.readAsText(file);
  };

  const toggleTool = (name: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const importSelected = async () => {
    if (!result) return;
    const chosen = result.tools.filter((t) => !excluded.has(t.name));
    if (chosen.length === 0) return;

    setIsImporting(true);
    setError(null);
    try {
      const created = await Promise.all(
        chosen.map((tool) =>
          getOrCreateTool({
            name: tool.name,
            domain: tool.domain,
            logoUrl: tool.logoUrl,
            iconSlug: tool.iconSlug,
            category: tool.category,
          })
        )
      );

      const byCategory = new Map<string, Id<"tools">[]>();
      created.forEach((tool, i) => {
        const category = chosen[i].category;
        byCategory.set(category, [...(byCategory.get(category) ?? []), tool._id]);
      });

      for (const [category, newIds] of byCategory) {
        const section = sections.find((s) => s.sectionType === category);
        if (!section) continue;
        const existingIds = section.selectedTools.map((st) => st.toolId);
        const merged = [...new Set([...existingIds, ...newIds])];
        await updateSectionTools({ sectionId: section._id, toolIds: merged });
      }

      setDone(true);
    } catch (err) {
      console.error("Import failed:", err);
      setError("Something went wrong while importing. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = result ? result.tools.length - excluded.size : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
        else void loadRepos();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <HugeiconsIcon icon={GithubIcon} className="h-4 w-4" /> Import your
          stack
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import your stack</DialogTitle>
          <DialogDescription>
            We match dependencies against known tools — nothing is added to
            your card until you review it.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="github">
          <TabsList className="w-full">
            <TabsTrigger value="github" className="flex-1">
              From GitHub
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex-1">
              Paste package.json
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" className="mt-3 flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="owner/repo or github.com URL"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void detectRepo(repoInput);
                }}
                disabled={isDetecting}
              />
              <Button
                variant="brand"
                onClick={() => void detectRepo(repoInput)}
                disabled={isDetecting || !repoInput.trim()}
              >
                {isDetecting ? (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  "Detect"
                )}
              </Button>
            </div>

            <div className="rounded-lg border border-border p-2">
              <p className="mb-1.5 px-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Your repositories
              </p>
              {repoList.status === "loading" && (
                <p className="px-1 py-2 text-sm text-muted-foreground">
                  Loading repos…
                </p>
              )}
              {repoList.status === "signed_out" && (
                <p className="px-1 py-2 text-sm text-muted-foreground">
                  Sign in with GitHub to pick from your repos — or paste any
                  repo URL above.
                </p>
              )}
              {repoList.status === "not_connected" && (
                <p className="px-1 py-2 text-sm text-muted-foreground">
                  Connect GitHub to your account to browse your repos (Profile
                  → Connected accounts) — or paste a repo URL above.
                </p>
              )}
              {repoList.status === "error" && (
                <p className="px-1 py-2 text-sm text-muted-foreground">
                  Couldn&apos;t load your repos right now — paste a repo URL
                  above instead.
                </p>
              )}
              {repoList.status === "ready" && (
                <div className="flex max-h-44 flex-col gap-0.5 overflow-y-auto">
                  {repoList.repos.map((r) => (
                    <button
                      key={r.fullName}
                      type="button"
                      onClick={() => void detectRepo(r.fullName)}
                      disabled={isDetecting}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium hover:bg-accent disabled:opacity-50"
                    >
                      <HugeiconsIcon
                        icon={GithubIcon}
                        className="h-3.5 w-3.5 text-muted-foreground"
                      />
                      <span className="truncate">{r.fullName}</span>
                      {r.private && (
                        <HugeiconsIcon
                          icon={LockIcon}
                          className="ml-auto h-3 w-3 shrink-0 text-muted-foreground"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="paste" className="mt-3 flex flex-col gap-2">
            <Textarea
              placeholder='Paste your package.json here — only dependency names are read, nothing else leaves your machine…'
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              className="h-36 font-mono text-xs"
              disabled={isDetecting}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="brand"
                onClick={() => void detectPaste(pasteInput)}
                disabled={isDetecting || !pasteInput.trim()}
              >
                {isDetecting ? (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  "Detect tools"
                )}
              </Button>
              <label className="cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline">
                …or choose a file
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{sourceLabel}</span>
              {result.tools.length === 0
                ? " — no recognizable tools found."
                : ` — found ${result.tools.length} tool${
                    result.tools.length === 1 ? "" : "s"
                  }. Tap to exclude any you don't want.`}
            </p>

            <div className="flex flex-wrap gap-2">
              {result.tools.map((tool) => {
                const isExcluded = excluded.has(tool.name);
                return (
                  <button
                    key={tool.name}
                    type="button"
                    onClick={() => toggleTool(tool.name)}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      isExcluded
                        ? "border-dashed opacity-40"
                        : "border-primary/50 bg-accent"
                    }`}
                  >
                    <LogoFramework
                      name={tool.name}
                      slug={tool.iconSlug}
                      src={tool.logoUrl}
                      url={tool.domain}
                    />
                    {tool.name}
                  </button>
                );
              })}
            </div>

            {result.tools.length > 0 && (
              <Button
                onClick={() => void importSelected()}
                disabled={isImporting || selectedCount === 0 || done}
                className="bg-foreground text-background hover:bg-foreground/85"
              >
                {done ? (
                  <>
                    <HugeiconsIcon icon={Tick01Icon} className="h-4 w-4" /> Added
                    to your stack
                  </>
                ) : isImporting ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="h-4 w-4 animate-spin"
                    />{" "}
                    Importing…
                  </>
                ) : (
                  `Add ${selectedCount} tool${selectedCount === 1 ? "" : "s"}`
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
