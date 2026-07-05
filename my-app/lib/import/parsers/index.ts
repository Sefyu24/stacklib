// Parser registry. Adding an ecosystem later = implementing one stub and
// nothing else; the match pipeline is ecosystem-agnostic.

import type { ManifestFile, ManifestParser, PackageRef } from "@/lib/import/types";
import { packageJsonParser } from "./packageJson";

const stub = (
  ecosystem: ManifestParser["ecosystem"],
  filePatterns: string[]
): ManifestParser => ({
  ecosystem,
  filePatterns,
  // Not implemented yet (web-dev focus) — returns no refs rather than failing.
  parse: () => [],
});

export const MANIFEST_PARSERS: ManifestParser[] = [
  packageJsonParser,
  stub("python", ["requirements.txt", "pyproject.toml", "pipfile"]),
  stub("rust", ["cargo.toml"]),
  stub("go", ["go.mod"]),
  stub("ruby", ["gemfile"]),
  stub("php", ["composer.json"]),
  stub("jvm", ["pom.xml", "build.gradle", "build.gradle.kts"]),
];

export function parserFor(fileName: string): ManifestParser | undefined {
  const lower = fileName.toLowerCase();
  return MANIFEST_PARSERS.find((p) =>
    p.filePatterns.some((pat) => lower === pat || lower.endsWith(`/${pat}`))
  );
}

export function parseManifests(files: ManifestFile[]): PackageRef[] {
  return files.flatMap((f) => parserFor(f.name)?.parse(f) ?? []);
}
