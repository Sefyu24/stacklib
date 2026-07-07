/**
 * Superstacks brand constants.
 *
 * The logomark glyph comes from the Second Scent brand package
 * (~/Downloads/Second_Scent_Branding) — the mark itself carries no text,
 * so it pairs with a "SUPERSTACKS" wordmark set in our own type.
 * Colors are normalized to the app tokens (the source files use
 * #1a1a1a/#ed6809; we render with our ink/primary instead).
 */

export const LOGOMARK_VIEWBOX = "0 0 1500 1617";

/** width / height of the glyph's viewBox — keeps sizing proportional. */
export const LOGOMARK_ASPECT = 1500 / 1617;

/** The two interlocking swirl halves (rendered in ink). */
export const LOGOMARK_SWIRLS = [
  "M1500,520.18c0-9.57-.29-19.07-.8-28.51-150.38,320.59-584.77,432.65-727.08,461.18-226.12,45.34-481.14,160.72-518.65,348.57-13.36,73.41,8.54,144.48,58.68,189.76,30.89,27.87,69.39,42.6,111.37,42.6,18.07,0,36.87-2.69,55.85-8.01,49.55-18.08,69.96-58.07,111.25-159.27,50.66-124.19,120.02-294.29,343.1-363.05,48.23-15.46,98.55-23.35,149.31-23.35,145.99,0,285.55,66.75,373.31,178.55,11.65,14.84,21.92,30.26,31.4,45.96,7.95-36.2,12.26-73.77,12.26-112.36v-572.06Z",
  "M713.31,659.6c233.46-46.82,496.16-162.98,533.27-348.61,13.34-73.41-8.59-144.47-58.7-189.72-30.86-27.86-69.39-42.59-111.4-42.59-18.07,0-36.89,2.7-55.85,8-49.52,18.08-69.94,58.07-111.23,159.28-50.7,124.24-120.09,294.31-343.11,363.05-48.2,15.46-98.51,23.34-149.3,23.34-145.99.01-285.55-66.74-373.31-178.54-11.65-14.85-21.93-30.27-31.41-45.99-7.96,36.21-12.27,73.78-12.27,112.37v572.06c0,9.22.25,18.38.73,27.48,148.89-321.99,573.52-432.24,712.59-460.12Z",
];

/** The two leaf accents (rendered in primary orange). */
export const LOGOMARK_LEAVES = [
  "M518.63,309.43c-76.2,50.66-179.04,29.95-229.7-46.26-50.66-76.2-29.95-179.04,46.26-229.7C411.39-17.19,677.74,4.71,677.74,4.71c0,0-82.91,254.06-159.11,304.72Z",
  "M990.07,1307.58c76.2-50.66,179.04-29.95,229.7,46.26,50.66,76.2,29.95,179.04-46.26,229.7-76.2,50.66-342.55,28.76-342.55,28.76,0,0,82.91-254.06,159.11-304.72Z",
];

export const BRAND_INK = "#1C1712";
export const BRAND_ORANGE = "#EC5B13";
export const BRAND_IVORY = "#F6F1E8";
