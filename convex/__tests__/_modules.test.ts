/**
 * Module map for convex-test (Bun). Keys match paths relative to the convex/ root.
 */
const convexRoot = new URL("..", import.meta.url).pathname;
import Bun from "bun";

function loadConvexModules(): Record<string, () => Promise<unknown>> {
  const modules: Record<string, () => Promise<unknown>> = {};
  const glob = new Bun.Glob("**/*.{ts,js}");

  for (const relativePath of glob.scanSync({
    cwd: convexRoot,
    onlyFiles: true,
  })) {
    if (
      relativePath.startsWith("__tests__/") ||
      relativePath.endsWith(".d.ts")
    ) {
      continue;
    }
    const key = `./${relativePath.replace(/\\/g, "/")}`;
    const fileUrl = new URL(`../${relativePath}`, import.meta.url).href;
    modules[key] = () => import(fileUrl);
  }

  return modules;
}

export const modules = loadConvexModules();
