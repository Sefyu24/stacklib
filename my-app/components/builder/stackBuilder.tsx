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
import CardSwitcher from "@/components/builder/cardSwitcher";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import SectionsBoard from "@/components/builder/sectionsBoard";
import StackCardPreview from "@/components/card/stackCardPreview";
import GithubImportDialog from "@/components/github/importDialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PencilEdit02Icon,
  PinIcon,
  GithubIcon,
  GlobeIcon,
  CircleLock01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons";

interface StackBuilderProps {
  stackId: Id<"stacks">;
}

/**
 * The full builder UI for a single stack. The parent route decides *which*
 * stack (the signed-in user's default, a guest's single card, or a specific
 * /stack/[stackId]) and hands the id down; this component renders and edits it.
 */
export default function StackBuilder({ stackId }: StackBuilderProps) {
  const { user } = useUser();
  // Convex authenticates its socket after Clerk loads; acting as the
  // signed-in user before the handshake would fail the ownership checks.
  const { isAuthenticated } = useConvexAuth();

  const getOrCreateTool = useMutation(api.tools.getOrCreateTool);
  const updateToolsMutation = useMutation(api.stacks.updateSectionTools);
  const reorderToolsMutation = useMutation(api.stacks.reorderSectionTools);
  const moveToolMutation = useMutation(api.stacks.moveToolToSection);
  const togglePinnedMutation = useMutation(api.stacks.togglePinnedTool);
  const updateStackDetailsMutation = useMutation(api.stacks.updateStackDetails);
  const setCardThemeMutation = useMutation(api.stacks.setCardTheme);
  const updateStackIdentityMutation = useMutation(api.stacks.updateStackIdentity);
  const setStackVisibilityMutation = useMutation(api.profiles.setStackVisibility);

  const stack = useQuery(api.stacks.getStack, { stackId });

  const [title, setTitle] = useState("");
  useEffect(() => {
    if (stack?.name) setTitle(stack.name);
  }, [stack?.name]);

  const [subtitle, setSubtitle] = useState("");
  useEffect(() => {
    setSubtitle(stack?.subtitle ?? "");
  }, [stack?.subtitle]);

  const [description, setDescription] = useState("");
  useEffect(() => {
    setDescription(stack?.description ?? "");
  }, [stack?.description]);

  const [repoUrl, setRepoUrl] = useState("");
  useEffect(() => {
    setRepoUrl(stack?.projectURL ?? "");
  }, [stack?.projectURL]);

  const [authorName, setAuthorName] = useState("");
  const [authorHandle, setAuthorHandle] = useState("");
  useEffect(() => {
    setAuthorName(stack?.authorName ?? "");
  }, [stack?.authorName]);
  useEffect(() => {
    setAuthorHandle(stack?.authorHandle ?? "");
  }, [stack?.authorHandle]);

  // The card avatar is the signed-in user's GitHub profile picture — never a
  // manual URL. Persist Clerk's imageUrl to authorAvatarUrl once it's known
  // and differs from what's stored. Convex acts as the signed-in user, so wait
  // for the auth handshake before writing (the mutation asserts ownership).
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    const githubAvatar = user.imageUrl ?? "";
    if (!githubAvatar) return;
    if ((stack?.authorAvatarUrl ?? "") === githubAvatar) return;
    updateStackIdentityMutation({
      stackId,
      authorAvatarUrl: githubAvatar,
    }).catch((err) => console.error("Error saving GitHub avatar:", err));
  }, [
    user,
    isAuthenticated,
    stackId,
    stack?.authorAvatarUrl,
    updateStackIdentityMutation,
  ]);

  if (stack === undefined) {
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
      updateStackDetailsMutation({ stackId, title: next }).catch((err) =>
        console.error("Error renaming stack:", err)
      );
    } else if (!next) {
      setTitle(stack!.name);
    }
  }

  function commitSubtitle() {
    const next = subtitle.trim();
    if (next !== (stack!.subtitle ?? "")) {
      updateStackDetailsMutation({ stackId, subtitle: next }).catch((err) =>
        console.error("Error updating subtitle:", err)
      );
    }
  }

  function commitDescription() {
    const next = description.trim();
    if (next !== (stack!.description ?? "")) {
      updateStackDetailsMutation({ stackId, description: next }).catch((err) =>
        console.error("Error updating description:", err)
      );
    }
  }

  function commitRepoUrl() {
    const raw = repoUrl.trim();
    // Basic URL hygiene: prepend https:// when the user typed a bare host so
    // links resolve, and reject obviously non-URL text before persisting.
    let next = raw;
    if (next && !/^https?:\/\//i.test(next)) {
      next = `https://${next}`;
    }
    if (next) {
      try {
        // Throws on garbage; keeps us from storing unusable strings.
        new URL(next);
      } catch {
        toast.error("That doesn't look like a valid link.");
        setRepoUrl(stack!.projectURL ?? "");
        return;
      }
    }
    if (next !== (stack!.projectURL ?? "")) {
      // Reflect any normalization back into the field.
      if (next !== raw) setRepoUrl(next);
      updateStackDetailsMutation({ stackId, repoUrl: next }).catch((err) =>
        console.error("Error updating repo link:", err)
      );
    }
  }

  function commitIdentity(field: "authorName" | "authorHandle", value: string) {
    if ((stack![field] ?? "") === value.trim()) return;
    updateStackIdentityMutation({ stackId, [field]: value }).catch((err) =>
      console.error("Error updating card identity:", err)
    );
  }

  const showAvatar = stack.showAvatar ?? true;
  const isPublic = stack.isPublic ?? false;
  const isSignedIn = Boolean(user);

  const selectedNames = stack.sections.flatMap((s) =>
    s.selectedTools.map((st) => st.tool.name)
  );

  return (
    <main className="bg-background">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-6 px-4 py-6 sm:px-6 sm:py-9 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-9">
        {/* ============ BUILDER ============ */}
        <div className="min-w-0 rounded-[20px] border border-border bg-card p-5 shadow-[0_1px_3px_rgba(60,40,10,0.05)] sm:p-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            {/* Signed-in users can own many cards — switch, add, or delete
                here. Guests have one card, so the switcher is hidden. */}
            {isSignedIn && isAuthenticated ? (
              <CardSwitcher
                currentStackId={stackId}
                currentName={stack.name}
              />
            ) : (
              <div />
            )}
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

          {/* Longer description + repo link. These do NOT appear on the card
              image — they surface when someone views the card on the site. */}
          <div className="mb-6 rounded-[10px] border border-border p-3">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
                About this card
              </span>
            </div>
            <label
              htmlFor="stack-description"
              className="mb-1 block text-[11.5px] font-semibold text-[#8A7B63]"
            >
              Description
            </label>
            <Textarea
              id="stack-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={commitDescription}
              placeholder="Tell people about this stack: what it's for, why you chose these tools… (shown on the card's page, not the card image)"
              aria-label="Card description"
              className="min-h-[84px] resize-y bg-white text-[13.5px]"
            />
            <label
              htmlFor="stack-repo"
              className="mt-3 mb-1 block text-[11.5px] font-semibold text-[#8A7B63]"
            >
              Repo link
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Link01Icon}
                className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#B4A78E]"
                aria-hidden
              />
              <Input
                id="stack-repo"
                type="url"
                inputMode="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onBlur={commitRepoUrl}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder="github.com/you/project"
                aria-label="Repo link"
                className="bg-white pl-9 text-[13.5px]"
              />
            </div>
          </div>

          <div className="rounded-[10px] border border-border p-3 mb-6">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
                Card identity
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
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
            </div>

            {/* GitHub photo: the ONLY avatar control. When signed in via
                GitHub, Clerk's imageUrl is auto-saved to authorAvatarUrl (see
                effect above); this toggle just shows/hides it on the card. */}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <div className="flex min-w-0 items-center gap-2">
                <HugeiconsIcon
                  icon={GithubIcon}
                  className="h-[15px] w-[15px] flex-none text-[#8A7B63]"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-foreground">
                    Show my GitHub photo
                  </p>
                  {!isSignedIn && (
                    <p className="text-[11px] leading-snug text-[#B4A78E]">
                      Sign in with GitHub to add your profile picture.
                    </p>
                  )}
                </div>
              </div>
              <Toggle
                size="sm"
                pressed={isSignedIn && showAvatar}
                disabled={!isSignedIn}
                onPressedChange={() =>
                  updateStackIdentityMutation({
                    stackId,
                    showAvatar: !showAvatar,
                  }).catch((err) =>
                    console.error("Error toggling avatar:", err)
                  )
                }
                aria-label="Show my GitHub photo"
                className="h-7 shrink-0 px-2 font-mono text-[11px] font-semibold text-[#8A7B63] data-[state=on]:text-foreground"
              >
                {isSignedIn && showAvatar ? "On" : "Off"}
              </Toggle>
            </div>

            {/* Profile visibility — public/private. Only meaningful when
                signed in; disabled with a hint for guests. */}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <div className="flex min-w-0 items-center gap-2">
                <HugeiconsIcon
                  icon={isPublic && isSignedIn ? GlobeIcon : CircleLock01Icon}
                  className="h-[15px] w-[15px] flex-none text-[#8A7B63]"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-foreground">
                    Show this card on my profile
                  </p>
                  <p className="text-[11px] leading-snug text-[#B4A78E]">
                    {!isSignedIn
                      ? "Sign in to publish this card to your profile."
                      : isPublic
                        ? "Public. Anyone can find it on your profile."
                        : "Private. Only you can see it."}
                  </p>
                </div>
              </div>
              <Toggle
                size="sm"
                pressed={isSignedIn && isPublic}
                disabled={!isSignedIn}
                onPressedChange={() =>
                  setStackVisibilityMutation({
                    stackId,
                    isPublic: !isPublic,
                  }).catch((err) =>
                    console.error("Error updating visibility:", err)
                  )
                }
                aria-label="Show this card on my profile"
                className="h-7 shrink-0 px-2 font-mono text-[11px] font-semibold text-[#8A7B63] data-[state=on]:text-foreground"
              >
                {isSignedIn && isPublic ? "Public" : "Private"}
              </Toggle>
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
            setCardThemeMutation({ stackId, cardTheme })
          }
        />
      </div>
    </main>
  );
}
