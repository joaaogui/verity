import path from "node:path";

const FIXTURES_ROOT = path.resolve(process.cwd(), "test-docs");

/** Resolve a fixture path under test-docs with containment (no client-controlled paths). */
export function resolveFixturePath(
  relativeFromRepo: string,
  fixturesRoot: string = FIXTURES_ROOT,
): string | null {
  const withoutPrefix = relativeFromRepo.startsWith("test-docs/")
    ? relativeFromRepo.slice("test-docs/".length)
    : relativeFromRepo;

  if (
    withoutPrefix.includes("\0") ||
    path.isAbsolute(withoutPrefix) ||
    withoutPrefix.split(/[/\\]/).includes("..")
  ) {
    return null;
  }

  const fullPath = path.resolve(fixturesRoot, withoutPrefix);
  const relative = path.relative(fixturesRoot, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return fullPath;
}
