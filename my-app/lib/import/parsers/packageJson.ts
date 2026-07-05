import type { ManifestParser, PackageRef } from "@/lib/import/types";

/**
 * The one fully implemented parser (web-dev first). Reads dependency NAMES
 * only — versions and anything else in the file are ignored, so pasting a
 * private project's package.json shares nothing sensitive.
 */
export const packageJsonParser: ManifestParser = {
  ecosystem: "npm",
  filePatterns: ["package.json"],
  parse(file): PackageRef[] {
    try {
      const pkg = JSON.parse(file.content) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const names = Object.keys({
        ...pkg.dependencies,
        ...pkg.devDependencies,
      });
      return names.map((name) => ({ name, ecosystem: "npm" }));
    } catch {
      return [];
    }
  },
};
