// Shared types for the stack-import pipeline. Every input source (pasted
// manifest, public repo URL, connected GitHub repo) normalizes to
// ManifestFile[] → PackageRef[] → Suggestion[]. Suggestions are ALWAYS
// reviewed by the user before anything is pinned to a card — there is no
// code path from detection to a published card.

import type { DetectedTool } from "@/lib/github/tool-map";

export interface ManifestFile {
  /** File name, e.g. "package.json" */
  name: string;
  /** Raw file contents (UTF-8) */
  content: string;
}

export interface PackageRef {
  /** Package name as written in the manifest, e.g. "next" */
  name: string;
  /** Which ecosystem the ref came from */
  ecosystem: Ecosystem;
}

export type Ecosystem =
  | "npm"
  | "python"
  | "rust"
  | "go"
  | "ruby"
  | "php"
  | "jvm";

/** A detected tool the user can review; alias of the detect-route shape. */
export type Suggestion = DetectedTool;

export interface ManifestParser {
  ecosystem: Ecosystem;
  /** Lowercased file names (or suffixes) this parser understands */
  filePatterns: string[];
  /** Extract package refs from one manifest file. Deterministic, no AI. */
  parse(file: ManifestFile): PackageRef[];
}
