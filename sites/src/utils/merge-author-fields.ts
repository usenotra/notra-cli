import type { AuthorFields } from "../types/authors";

export function mergeAuthorFields(
  fallback: AuthorFields,
  preferred: AuthorFields | undefined
): AuthorFields {
  if (!preferred) {
    return fallback;
  }
  return {
    ...fallback,
    ...Object.fromEntries(
      Object.entries(preferred).filter(([, value]) => value !== undefined)
    ),
  };
}
