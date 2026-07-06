import { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Ownership model: `stacks.userId` (and `profiles.ownerId`) is either a
 * guest key (`guest_<uuid>` from the builder; possession of the
 * locally-generated key is the credential) or a Clerk user id
 * (`user_...`), which must match the caller's JWT.
 */
export function isGuestId(ownerId: string): boolean {
  return /^guest[_:]/.test(ownerId);
}

/** Whether the caller is allowed to act as `ownerId`. */
export async function canActAs(
  ctx: QueryCtx | MutationCtx,
  ownerId: string | undefined
): Promise<boolean> {
  // Legacy rows created before ownership existed have no userId; nothing
  // sensitive lives on them, so they stay editable (matches old behavior).
  if (ownerId === undefined) return true;
  if (isGuestId(ownerId)) return true;
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject === ownerId;
}

export async function assertCanActAs(
  ctx: QueryCtx | MutationCtx,
  ownerId: string | undefined
): Promise<void> {
  if (!(await canActAs(ctx, ownerId))) {
    throw new Error("Not authorized");
  }
}

/** Resolve a section to its stack and assert the caller owns it. */
export async function assertSectionOwner(
  ctx: MutationCtx,
  sectionId: import("./_generated/dataModel").Id<"sections">
): Promise<void> {
  const section = await ctx.db.get(sectionId);
  if (!section) throw new Error("Section not found");
  const stack = await ctx.db.get(section.stackId);
  if (!stack) throw new Error("Stack not found");
  await assertCanActAs(ctx, stack.userId);
}
