"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  CATEGORY_LABELS,
  CatalogTool,
  CatalogCategory,
} from "@/lib/catalog";
import UniversalSearch from "@/components/builder/universalSearch";
import SectionBlock from "@/components/builder/sectionBlock";
import StackCardPreview from "@/components/card/stackCardPreview";
import GithubImportDialog from "@/components/github/importDialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { PinIcon } from "@hugeicons/core-free-icons";

const GUEST_KEY = "superstack_guest_id";

export default function StackEditor() {
  const { user, isLoaded } = useUser();
  const [stackId, setStackId] = useState<Id<"stacks"> | null>(null);

  const getOrCreateStack = useMutation(api.stacks.getOrCreateStack);
  const adoptGuestStack = useMutation(api.stacks.adoptGuestStack);
  const getOrCreateTool = useMutation(api.tools.getOrCreateTool);
  const updateToolsMutation = useMutation(api.stacks.updateSectionTools);
  const reorderToolsMutation = useMutation(api.stacks.reorderSectionTools);
  const togglePinnedMutation = useMutation(api.stacks.togglePinnedTool);
  const updateStackDetailsMutation = useMutation(api.stacks.updateStackDetails);
  const setCardThemeMutation = useMutation(api.stacks.setCardTheme);

  const stack = useQuery(api.stacks.getStack, stackId ? { stackId } : "skip");

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    (async () => {
      let ownerId: string;
      if (user) {
        const guestId = localStorage.getItem(GUEST_KEY);
        if (guestId) {
          await adoptGuestStack({ guestId, userId: user.id });
          localStorage.removeItem(GUEST_KEY);
        }
        ownerId = user.id;
      } else {
        let guestId = localStorage.getItem(GUEST_KEY);
        if (!guestId) {
          guestId = `guest_${crypto.randomUUID()}`;
          localStorage.setItem(GUEST_KEY, guestId);
        }
        ownerId = guestId;
      }
      const id = await getOrCreateStack({ ownerId });
      if (!cancelled) setStackId(id);
    })().catch((err) => console.error("Error loading stack:", err));
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id, adoptGuestStack, getOrCreateStack, user]);

  const [title, setTitle] = useState("");
  useEffect(() => {
    if (stack?.name) setTitle(stack.name);
  }, [stack?.name]);

  const [subtitle, setSubtitle] = useState("");
  useEffect(() => {
    setSubtitle(stack?.subtitle ?? "");
  }, [stack?.subtitle]);

  if (!stackId || stack === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading your stack…</p>
        </div>
      </div>
    );
  }

  // --- mutations wired to the builder ---------------------------------------

  async function appendTool(
    category: CatalogCategory,
    args: { name: string; slug?: string; domain?: string; logoUrl?: string }
  ) {
    const section = stack!.sections.find((s) => s.sectionType === category);
    if (!section) return;
    try {
      const tool = await getOrCreateTool({
        name: args.name,
        category,
        iconSlug: args.slug,
        domain: args.domain,
        logoUrl: args.logoUrl,
      });
      const ids = section.selectedTools.map((st) => st.toolId);
      if (ids.includes(tool._id)) return;
      await updateToolsMutation({
        sectionId: section._id,
        toolIds: [...ids, tool._id],
      });
    } catch (err) {
      console.error("Error adding tool:", err);
      toast.error("Couldn't add that tool. Please try again.");
    }
  }

  async function handleAddCatalog(tool: CatalogTool) {
    await appendTool(tool.category, { name: tool.name, slug: tool.slug });
    toast.success(`${tool.name} added to ${CATEGORY_LABELS[tool.category]}`);
  }

  async function handleAddCustom(name: string) {
    // Enrich unknown tools with a Brandfetch logo where possible.
    let domain: string | undefined;
    let logoUrl: string | undefined;
    try {
      const res = await fetch(
        `/api/brandfetch/search?name=${encodeURIComponent(name)}`
      );
      if (res.ok) {
        const brands = (await res.json()) as {
          domain?: string;
          icon?: string | null;
        }[];
        const top = brands.find((b) => b.icon) ?? brands[0];
        if (top) {
          domain = top.domain;
          logoUrl = top.icon ?? undefined;
        }
      }
    } catch {
      // fall through — the tool is still added, just without a logo
    }
    await appendTool("other", { name, domain, logoUrl });
    toast.success(`${name} added to Other`);
  }

  async function handleReorder(
    sectionId: Id<"sections">,
    orderedToolIds: Id<"tools">[]
  ) {
    try {
      await reorderToolsMutation({ sectionId, orderedToolIds });
    } catch (err) {
      console.error("Error reordering tools:", err);
    }
  }

  async function handleTogglePin(
    sectionId: Id<"sections">,
    toolId: Id<"tools">
  ) {
    try {
      await togglePinnedMutation({ sectionId, toolId });
    } catch (err) {
      console.error("Error toggling pin:", err);
    }
  }

  async function handleRemove(
    sectionId: Id<"sections">,
    toolId: Id<"tools">,
    currentIds: Id<"tools">[]
  ) {
    try {
      await updateToolsMutation({
        sectionId,
        toolIds: currentIds.filter((id) => id !== toolId),
      });
    } catch (err) {
      console.error("Error removing tool:", err);
    }
  }

  function commitTitle() {
    const next = title.trim();
    if (next && next !== stack!.name) {
      updateStackDetailsMutation({ stackId: stackId!, title: next }).catch(
        (err) => console.error("Error renaming stack:", err)
      );
    } else if (!next) {
      setTitle(stack!.name);
    }
  }

  function commitSubtitle() {
    const next = subtitle.trim();
    if (next !== (stack!.subtitle ?? "")) {
      updateStackDetailsMutation({ stackId: stackId!, subtitle: next }).catch(
        (err) => console.error("Error updating subtitle:", err)
      );
    }
  }

  const selectedNames = stack.sections.flatMap((s) =>
    s.selectedTools.map((st) => st.tool.name)
  );

  return (
    <main className="bg-background">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-6 px-4 py-6 sm:px-6 sm:py-9 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-9">
        {/* ============ BUILDER ============ */}
        <div className="min-w-0 rounded-[20px] border border-border bg-card p-5 shadow-[0_1px_3px_rgba(60,40,10,0.05)] sm:p-8">
          <div className="mb-4 flex justify-end">
            <GithubImportDialog sections={stack.sections} />
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            aria-label="Stack name"
            spellCheck={false}
            className="mb-1.5 w-full border-none bg-transparent p-0 text-[26px] font-black tracking-[-0.02em] text-foreground outline-none sm:text-[34px]"
          />
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            onBlur={commitSubtitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            aria-label="Stack tagline"
            spellCheck={false}
            placeholder="Add a one-line tagline (optional)"
            className="mb-1.5 w-full border-none bg-transparent p-0 text-[15px] font-medium text-[#8A7B63] outline-none placeholder:text-[#B4A78E]"
          />
          <p className="mb-6 flex flex-wrap items-center gap-1 text-[13.5px] leading-relaxed text-[#8A7B63]">
            Search once, we file each tool in the right section. Pin
            <HugeiconsIcon
              icon={PinIcon}
              className="inline h-[11px] w-[11px] text-primary"
              style={{ fill: "var(--primary)" }}
            />
            to feature a tool on your card, drag to reorder.
          </p>

          <UniversalSearch
            selectedNames={selectedNames}
            onAddCatalog={handleAddCatalog}
            onAddCustom={handleAddCustom}
          />

          <div className="flex flex-col gap-[26px]">
            {stack.sections.map((section) => (
              <SectionBlock
                key={section._id}
                section={section}
                onAddCatalog={handleAddCatalog}
                onReorder={(ids) => handleReorder(section._id, ids)}
                onTogglePin={(toolId) => handleTogglePin(section._id, toolId)}
                onRemove={(toolId) =>
                  handleRemove(
                    section._id,
                    toolId,
                    section.selectedTools.map((st) => st.toolId)
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* ============ LIVE PREVIEW ============ */}
        <StackCardPreview
          stack={stack}
          stackId={stackId}
          onSetTheme={(cardTheme) =>
            setCardThemeMutation({ stackId: stackId!, cardTheme })
          }
        />
      </div>
    </main>
  );
}
