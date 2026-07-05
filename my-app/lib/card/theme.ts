// Card visual themes. Both the live HTML preview and the OG image route read
// from these tokens so the two renderings never drift. Adding a theme here is
// all that's needed to expose a new look in the (upcoming) card customizer.

export type CardTheme = {
  key: string;
  label: string;
  outerBg: string;
  cardBg: string;
  border: string;
  wordmark: string;
  title: string;
  count: string;
  label_: string; // section label color
  chipBg: string;
  chipBorder: string;
  chipText: string;
  pinnedBg: string;
  pinnedBorder: string;
  fallbackBorder: string;
  footerText: string;
  // Which Second Scent logomark file to use in the footer.
  logomark: "Logomark_onyx_orange.png" | "Logomark_ivory.png";
};

export const CARD_THEMES: Record<string, CardTheme> = {
  light: {
    key: "light",
    label: "Light",
    outerBg: "#f9f6ef",
    cardBg: "#ffffff",
    border: "#e5ded2",
    wordmark: "#ed6809",
    title: "#1a1a1a",
    count: "#8a7d70",
    label_: "#8a7d70",
    chipBg: "#ffffff",
    chipBorder: "#e5ded2",
    chipText: "#1a1a1a",
    pinnedBg: "#fdf1e7",
    pinnedBorder: "#ed6809",
    fallbackBorder: "#c4b8a9",
    footerText: "#8a7d70",
    logomark: "Logomark_onyx_orange.png",
  },
  dark: {
    key: "dark",
    label: "Dark",
    outerBg: "#141210",
    cardBg: "#1f1b18",
    border: "#332c26",
    wordmark: "#ed6809",
    title: "#f9f6ef",
    count: "#a1958a",
    label_: "#a1958a",
    chipBg: "#26211d",
    chipBorder: "#3a322c",
    chipText: "#f2ede4",
    pinnedBg: "#3a2213",
    pinnedBorder: "#ed6809",
    fallbackBorder: "#5c4f44",
    footerText: "#a1958a",
    logomark: "Logomark_ivory.png",
  },
};

export const DEFAULT_THEME_KEY = "light";

export function getCardTheme(key: string | undefined | null): CardTheme {
  return CARD_THEMES[key ?? DEFAULT_THEME_KEY] ?? CARD_THEMES[DEFAULT_THEME_KEY];
}
