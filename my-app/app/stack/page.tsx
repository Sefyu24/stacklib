"use client";

import { useState, useEffect } from "react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  CATEGORY_LABELS,
  CatalogTool,
  CatalogCategory,
} from "@/lib/catalog";
import UniversalSearch, {
  BrandPick,
} from "@/components/builder/universalSearch";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import SectionsBoard from "@/components/builder/sectionsBoard";
import StackCardPreview from "@/components/card/stackCardPreview";
import GithubImportDialog from "@/components/github/importDialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon, PinIcon } from "@hugeicons/core-free-icons";

const GUEST_KEY = "superstack_guest_id";

export default function StackEditor() {
  const { user, isLoaded } = useUser();
  // Convex authenticates its socket after Clerk loads; acting as the
  // signed-in user before the handshake would fail the ownership checks.
  const { isAuthenticated } = useConvexAuth();
  const [stackId, setStackId] = useState<Id<"stacks"> | null>(null);

  const getOrCreateStack = useMutation(api.stacks.getOrCreateStack);
  const adoptGuestStack = useMutation(api.stacks.adoptGuestStack);
  const getOrCreateTool = useMutation(api.tools.getOrCreateTool);
  const updateToolsMutation = useMutation(api.stacks.updateSectionTools);
  const reorderToolsMutation = useMutation(api.stacks.reorderSectionTools);
  const moveToolMutation = useMutation(api.stacks.moveToolToSection);
  const togglePinnedMutation = useMutation(api.stacks.togglePinnedTool);
  const updateStackDetailsMutation = useMutation(api.stacks.updateStackDetails);
  const setCardThemeMutation = useMutation(api.stacks.setCardTheme);
  const updateStackIdentityMutation = useMutation(api.stacks.updateStackIdentity);

  const stack = useQuery(api.stacks.getStack, stackId ? { stackId } : "skip");

  useEffect(() => {
    if (!isLoaded) return;
    if (user && !isAuthenticated) return;
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
  }, [isLoaded, isAuthenticated, user?.id, adoptGuestStack, getOrCreateStack, user]);

  const [title, setTitle] = useState("");
  useEffect(() => {
    if (stack?.name) setTitle(stack.name);
  }, [stack?.name]);

  const [subtitle, setSubtitle] = useState("");
  useEffect(() => {
    setSubtitle(stack?.subtitle ?? "");
  }, [stack?.subtitle]);
  const [authorName, setAuthorName] = useState("");
  const [authorHandle, setAuthorHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  useEffect(() => {
    setAuthorName(stack?.authorName ?? "");
  }, [stack?.authorName]);
  useEffect(() => {
    setAuthorHandle(stack?.authorHandle ?? "");
  }, [stack?.authorHandle]);
  useEffect(() => {
    setAvatarUrl(stack?.authorAvatarUrl ?? "");
  }, [stack?.authorAvatarUrl]);

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

  async function handleAddBrand(brand: BrandPick, category: CatalogCategory) {
    // The user picked the brand (or plain text) themselves in the search
    // dropdown — no silent first-hit guessing. The domain drives the
    // durable logo capture server-side.
    await appendTool(category, {
      name: brand.name,
      domain: brand.domain,
      logoUrl: brand.logoUrl,
    });
    toast.success(`${brand.name} added to ${CATEGORY_LABELS[category]}`);
  }

  async function handleReorder(
    sectionId: Id<"sections">,
    orderedToolIds: Id<"tools">[]
  ) {
    try {
      await reorderToolsMutation({ sectionId, orderedToolIds });
    } catch (err) {
      console.error("Error reordering tools:", err);
      toast.error("Couldn't save the new order. Please try again.");
      throw err;
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

  async function handleRemove(sectionId: Id<"sections">, toolId: Id<"tools">) {
    const section = stack!.sections.find((s) => s._id === sectionId);
    if (!section) return;
    try {
      await updateToolsMutation({
        sectionId,
        toolIds: section.selectedTools
          .map((st) => st.toolId)
          .filter((id) => id !== toolId),
      });
    } catch (err) {
      console.error("Error removing tool:", err);
    }
  }

  async function handleMove(
    toolId: Id<"tools">,
    fromSectionId: Id<"sections">,
    toSectionId: Id<"sections">,
    targetIndex: number
  ) {
    try {
      await moveToolMutation({ toolId, fromSectionId, toSectionId, targetIndex });
    } catch (err) {
      console.error("Error moving tool:", err);
      toast.error("Couldn't move that tool. Please try again.");
      throw err;
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

  function commitIdentity(
    field: "authorName" | "authorHandle" | "authorAvatarUrl",
    value: string
  ) {
    if ((stack![field] ?? "") === value.trim()) return;
    updateStackIdentityMutation({ stackId: stackId!, [field]: value }).catch(
      (err) => console.error("Error updating card identity:", err)
    );
  }

  const showAvatar = stack.showAvatar ?? true;

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

          {/* Title and tagline are editable in place — the dashed hover
              outline and the pencil make that discoverable. */}
          <div className="group/title relative mb-1.5 flex items-center gap-2.5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              aria-label="Stack name"
              spellCheck={false}
              title="Click to rename your stack"
              className="-mx-1.5 w-full min-w-0 rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 text-[26px] font-black tracking-[-0.02em] text-foreground outline-none transition-colors hover:border-dashed hover:border-[#D9C7A8] focus:border-solid focus:border-primary sm:text-[34px]"
            />
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              className="pointer-events-none h-[19px] w-[19px] flex-none text-[#C9BCA2] transition-colors group-hover/title:text-[#A0713C] group-focus-within/title:text-primary"
              aria-hidden
            />
          </div>
          <div className="group/tagline relative mb-1.5 flex items-center gap-2.5">
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
              title="Click to edit the tagline"
              className="-mx-1.5 w-full min-w-0 rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 text-[15px] font-medium text-[#8A7B63] outline-none transition-colors placeholder:text-[#B4A78E] hover:border-dashed hover:border-[#D9C7A8] focus:border-solid focus:border-primary"
            />
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              className="pointer-events-none h-[14px] w-[14px] flex-none text-[#C9BCA2] transition-colors group-hover/tagline:text-[#A0713C] group-focus-within/tagline:text-primary"
              aria-hidden
            />
          </div>
          <p className="mb-6 flex flex-wrap items-center gap-1 text-[13.5px] leading-relaxed text-[#8A7B63]">
            Search once, we file each tool in the right section. Pin
            <HugeiconsIcon
              icon={PinIcon}
              className="inline h-[11px] w-[11px] text-primary"
              style={{ fill: "var(--primary)" }}
            />
            to feature a tool on your card, drag to reorder.
          </p>

          <div className="rounded-[10px] border border-border p-3 mb-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
                Card identity
              </span>
              <Toggle
                size="sm"
                pressed={showAvatar}
                onPressedChange={() =>
                  updateStackIdentityMutation({
                    stackId: stackId!,
                    showAvatar: !showAvatar,
                  }).catch((err) =>
                    console.error("Error toggling avatar:", err)
                  )
                }
                aria-label="Show avatar"
                className="h-7 px-2 font-mono text-[11px] font-semibold text-[#8A7B63] data-[state=on]:text-foreground"
              >
                Show avatar
              </Toggle>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                onBlur={() => commitIdentity("authorName", authorName)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder="Display name"
                aria-label="Display name"
              />
              <Input
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                onBlur={() => commitIdentity("authorHandle", authorHandle)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder="@handle"
                aria-label="Handle"
              />
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                onBlur={() => commitIdentity("authorAvatarUrl", avatarUrl)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder="Avatar URL"
                aria-label="Avatar URL"
              />
            </div>
          </div>

          <UniversalSearch
            selectedNames={selectedNames}
            onAddCatalog={handleAddCatalog}
            onAddBrand={handleAddBrand}
          />

          <SectionsBoard
            sections={stack.sections}
            onAddCatalog={handleAddCatalog}
            onReorder={handleReorder}
            onMove={handleMove}
            onTogglePin={handleTogglePin}
            onRemove={handleRemove}
          />
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
