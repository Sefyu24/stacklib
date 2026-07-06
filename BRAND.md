# Superstack Brand Guidelines

Durable brand reference for anyone (human or AI) building Superstack UI. Read this **before** touching any visual surface.

- **Source of truth for identity**: the official *Second Scent Brand Guidelines* PDF (`~/Downloads/Second_Scent_Branding/Brand Guidelines.pdf`). Page references below cite it.
- **Source of truth for code**: the app itself — `my-app/app/globals.css`, `my-app/lib/brand.ts`, `my-app/components/brand/logo.tsx`, `my-app/components/ui/button.tsx`. Every hex/spec in this doc was audited against those files. **When the PDF and the app tokens disagree, the app tokens win in code.**

---

## 1. Brand overview

Superstack turns a developer's tech stack into a beautiful, shareable card. The visual identity is adopted from the Second Scent brand package: a warm cream-and-ink palette, a single lava-orange accent, an abstract swirl monogram, and a serif+grotesque wordmark lockup. The overall feel is **warm, tactile, confident** — chunky borders, hard offset shadows, monospace eyebrow labels, and heavy black display type. Nothing glossy, nothing gradient-happy, no cold grays.

---

## 2. Logo system

### 2.1 Logomark (glyph)

The logomark (PDF p9) is an **abstract monogram combining a "2" with two "S" forms** — negative space defines the form. Two interlocking swirl halves plus two leaf accents. Use it for favicons, social avatars, watermarks, and confined spaces where the wordmark won't fit.

**Code**: `my-app/components/brand/logo.tsx` exports `Logomark`. Path data lives in `my-app/lib/brand.ts` (`LOGOMARK_VIEWBOX = "0 0 1500 1617"`, `LOGOMARK_ASPECT`, `LOGOMARK_SWIRLS`, `LOGOMARK_LEAVES`). **Never recreate or re-trace the glyph — always import these.** It's a plain SVG with explicit fills, so it renders identically in the browser and inside satori (OG images).

```tsx
<Logomark size={24} />                              // all-orange (site default)
<Logomark size={20} ink="#F0E6D2" accent="#EC5B13" /> // ivory+orange on dark (footer)
```

Variants:

| Variant | When | Props |
|---|---|---|
| **All-orange** (site default per user directive) | Light surfaces, nav, card watermarks | default (`ink` and `accent` both default to `BRAND_ORANGE`) |
| Two-tone onyx + orange | Formal brand contexts | `ink={BRAND_INK}` (swirls ink, leaves orange) |
| All-ivory | Dark surfaces | `ink="#F6F1E8" accent="#F6F1E8"` (or ivory-adjacent like `#F0E6D2`) |
| All-onyx | Monochrome print/light contexts | `ink={BRAND_INK} accent={BRAND_INK}` |

### 2.2 Wordmark

Italic serif + heavy grotesque pairing. Original brand faces: **EB Garamond Italic + Forma DJR Display**. Forma DJR is **commercial and unlicensed** — **Archivo 900 is the approved stand-in**. If a Forma DJR web license is ever purchased, swap it in `components/brand/logo.tsx` `Wordmark` (single place).

Superstack wordmark = lowercase **"super"** (EB Garamond italic, weight 600) + **"stack"** (Archivo 900, `letter-spacing: -0.02em`). Always lowercase, always a **single color per use**:

- Ink (`#1C1712`) on light surfaces (default)
- Ivory (e.g. `#F0E6D2`) on dark surfaces (footer)
- Lava Orange (`#EC5B13`) as the card eyebrow on stack cards

**Code**: `Wordmark` in `components/brand/logo.tsx` (browser) — `<Wordmark size={18} />`, `<Wordmark size={13} color="#EC5B13" />`. The OG route has its own satori-safe `Wordmark` in `my-app/app/api/card/[stackId]/route.tsx` using the same pairing. EB Garamond italic is loaded **only** for this component (`--font-garamond`, weight 600 italic only, in `app/layout.tsx`).

### 2.3 Logo don'ts (PDF p10–11)

- Never skew or stretch the logo.
- Never recolor outside the brand colours.
- Never change the layout/arrangement of the lockup.
- No strokes or outlines on the logo.
- No drop shadows on the logo.
- Never tweak individual letters.
- No graphics into or behind the logo.
- Maintain clear space around it.

---

## 3. Color

### 3.1 Official Second Scent palette (PDF p13)

| Name | Hex | Role |
|---|---|---|
| Smoked Onyx | `#1a1a1a` | Primary |
| Ivory Mist | `#f9f6ef` | Primary |
| Royal Beige | `#d7c1aa` | Secondary |
| Lava Orange | `#ed6809` | Accent |
| Tobacco Amber | `#592500` | Accent |

**Ratio rule**: primaries ~60% of the design space, secondary ~30%, accents ~10%. Orange is seasoning, not sauce.

### 3.2 Adapted web tokens (what the app actually uses — these win in code)

The app intentionally adapts the palette for screens (slightly warmer ink, brighter orange, creamier bg). Defined in `my-app/app/globals.css` `:root` and mirrored as constants in `my-app/lib/brand.ts` (`BRAND_INK`, `BRAND_ORANGE`, `BRAND_IVORY`).

| Token / CSS var | Hex | Maps to (PDF) | Usage |
|---|---|---|---|
| `--background` | `#F6F1E8` | Ivory Mist | Page background (cream) |
| `--foreground` | `#1C1712` | Smoked Onyx | Ink: text, chunky borders, dark surfaces |
| `--card` | `#FFFDF8` | — | Card/panel surfaces |
| `--primary` | `#EC5B13` | Lava Orange | CTAs, accents, eyebrows, ring |
| `--primary-hover` | `#D94F0C` | — | CTA hover |
| `--primary-shadow` | `#C4470B` | — | CTA pressed/bottom shadow |
| `--primary-foreground` | `#FFF7EE` | — | Text on orange |
| `--secondary` / `--muted` | `#F1EADD` | — | Subtle fills, hover fills |
| `--muted-foreground` | `#8A7B63` | — | Muted/subtitle text |
| `--accent` | `#FDF1E6` | — | Tinted orange fill (badges) |
| `--border` | `#E8DFCE` | — | Soft hairline borders |
| `--input` | `#DACFB9` | — | Input/secondary-button borders |
| `--destructive` | `#C0392B` | — | Errors |
| taupe (literal) | `#B4A78E` | Royal Beige | Faint mono metadata, tertiary text |

Recurring literal support colors used across the landing page and cards (keep to these, don't invent new ones): body-muted `#6B5D46`, inner-card border `#EDE4D2`, chip border `#F0DCC2` on chip fill `#FFF8F0`, bento shell `#F3E8D6` with tile border `#E4D5BB` and amber text `#A0713C`, dashed accent `#D9A16B`, terminal bg `#16110B` with divider `#2C2418`, terminal text `#C9BCA2`/`#F0E6D2`, terminal greens/reds/yellows `#5BA35B`/`#E5533C`/`#E5A93C`.

Follow the 60/30/10 ratio in spirit: cream + ink dominate, beige/taupe supports, orange stays ~10%.

---

## 4. Typography

Three faces, loaded via `next/font/google` in `my-app/app/layout.tsx`. **Introduce no new fonts.**

| Face | CSS var | Weights loaded | Role |
|---|---|---|---|
| **Archivo** | `--font-archivo` (also `--font-sans`) | 500–900 | ALL UI and display text. Headings: `font-black` (900) with `tracking-[-0.02em]` to `-0.03em`, tight leading (`leading-[1.02]`–`[1.05]`). Sub-headings `font-extrabold tracking-[-0.015em]`. Subtitles/body-muted: regular-to-medium weight in `#8A7B63` or `#6B5D46`. |
| **JetBrains Mono** | `--font-jetbrains-mono` (also `--font-mono`) | 400–700 | Eyebrow labels, stats, metadata, terminal theme. Eyebrows are UPPERCASE, small (7.5–11px), `font-semibold`/`font-bold`, wide tracking `tracking-[0.16em]`–`[0.2em]` (never below `0.14em`). Metadata in taupe `#B4A78E`. |
| **EB Garamond** | `--font-garamond` | 600 italic ONLY | **Wordmark component only** — the italic "super". Never anywhere else. |

Pattern to copy — section header stack:

```tsx
<span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-primary">EYEBROW LABEL</span>
<h2 className="text-[30px] font-black tracking-[-0.025em] sm:text-[38px]">Heading here.</h2>
<p className="text-[15.5px] leading-relaxed text-[#6B5D46]">Muted subtitle.</p>
```

### Satori / OG image fonts

The card PNG route (`my-app/app/api/card/[stackId]/route.tsx`) can't see browser fonts — it loads static TTFs from `my-app/assets/fonts/`: Archivo 500/600/700/900, JetBrains Mono 400/700, EB Garamond Italic 600. Only request those weights in OG markup. **The subset TTFs have no `✓` (U+2713) glyph — use ASCII only on cards** (the terminal card uses `>` as its marker). Root element of the OG tree sets `fontFamily: "Archivo"`.

---

## 5. Component idioms

- **Chunky card**: `rounded-[18px] border-[1.5px] border-foreground shadow-[0_4px_0_var(--foreground)]` — hard ink offset shadow, no blur. Big containers scale up (footer CTA: `rounded-[22px]` + `shadow-[0_6px_0_var(--foreground)]`); small ones down (`shadow-[0_3px_0_var(--foreground)]`). OG equivalent: `Chunky` helper (2px ink border, radius 20, `0 5px 0` ink shadow).
- **Brand CTA**: `<Button variant="brand">` (`my-app/components/ui/button.tsx`) — orange fill, `shadow-[0_2px_0_var(--primary-shadow)]`, hover `--primary-hover`, active translates down 1px and shrinks the shadow (pressable feel). Hand-rolled large CTAs follow the same recipe with `shadow-[0_3px_0_var(--primary-shadow)]`.
- **Secondary action**: `border border-input bg-card font-bold hover:bg-secondary`.
- **Radius scale**: tokens `--radius: 0.625rem` (sm/md/lg/xl = 6/8/10/14px); in practice chips `rounded-[7px]`–`md`, tiles/rows `rounded-[10px]`–`xl`, cards `rounded-[18px]`, hero containers `rounded-[22px]`, nav/pills `rounded-full`.
- **Chips/pills**: inline-flex, icon + label, `rounded-[7px]` border `#F0DCC2` bg `#FFF8F0` (card chips) or border `#EDE4D2` bg `#F9F4EA` (community chips), 10.5–11.5px `font-semibold`.
- **Overflow chip**: dashed border `#D9A16B`, orange text, `+N more`.
- **Soft vs hard borders**: `border-border` (`#E8DFCE`) for quiet dividers/inner cards; `border-foreground` at 1.5px only when paired with a chunky shadow.
- **UI kit rules (hard)**: shadcn components ONLY. Icons: Hugeicons ONLY (`@hugeicons/react` + `@hugeicons/core-free-icons`, `<HugeiconsIcon icon={Xxx} className="..." />`). lucide-react is not installed — replace any generated lucide imports or the build fails.
- **Motion**: `blink` (terminal cursor) and `floaty` (hero card drift) keyframes in globals.css; respect `prefers-reduced-motion`.

---

## 6. Card themes

Three share-card themes, rendered twice (live preview `my-app/components/card/stackCardPreview.tsx`, OG PNG `my-app/app/api/card/[stackId]/route.tsx`) — keep them visually in sync:

- **minimal** — cream matte frame (`#FBF7F0`) around a white card; wordmark eyebrow in orange, mono section labels, warm chips.
- **bento** — beige shell (`#F3E8D6`); one kanban-style column per section, tinted tiles, amber (`#A0713C`) metadata.
- **terminal** — dark (`#16110B`) faux shell with traffic lights, mono type, `$ superstack show --pinned` prompt, green ok-lines, blinking orange cursor.

---

## 7. Voice & copy

- Short, confident sentences. Benefit first: "Your tech stack, ready to share."
- Brand name is lowercase **"superstack"** in wordmark contexts and URLs (`superstack.app/you`). **The all-caps "SUPERSTACK" treatment is retired — never use it.**
- Sentence case for headings ("Build one right now."); UPPERCASE is reserved for mono eyebrows/section labels.
- Friendly dev tone, light wit allowed ("This stack is still brewing"), no exclamation-mark hype.

---

## 8. Checklist before shipping new UI

1. Fonts: only Archivo / JetBrains Mono / EB Garamond (Garamond in `Wordmark` only)?
2. Headings `font-black` with negative tracking; subtitles regular weight in `#8A7B63`/`#6B5D46`?
3. Eyebrows/stats in JetBrains Mono, uppercase, tracking ≥ `0.14em` (usually `0.18em`+)?
4. Colors from the token table (CSS vars first, listed literals second) — nothing new invented?
5. Orange kept to ~10% of the surface?
6. Logo via `Logomark`/`Wordmark` imports — not redrawn, not skewed, not shadowed, not recolored off-palette?
7. Cards/containers: `border-[1.5px] border-foreground` + `shadow-[0_4px_0_var(--foreground)]`; CTAs `Button variant="brand"`?
8. shadcn components only; Hugeicons only (zero lucide-react imports)?
9. OG/card changes: ASCII only (no `✓`), fonts limited to the TTFs in `my-app/assets/fonts`, preview and PNG kept in sync?
10. Copy: lowercase "superstack", short and confident, no "SUPERSTACK"?
