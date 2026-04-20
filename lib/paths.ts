/**
 * Prefix a path from /public with the current basePath, if any.
 * Next.js `<Image>` and <img> tags do NOT auto-prefix public-folder paths
 * when using `output: 'export'` with a basePath (GitHub Pages), so we
 * prefix them ourselves.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(p: string): string {
  if (!p.startsWith("/")) return p;
  return `${BASE_PATH}${p}`;
}
