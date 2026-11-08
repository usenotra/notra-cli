import type { z } from "astro/zod";

import type { AUTHOR_PROFILE_FIELDS } from "../constants/authors";
import type { entryAuthorSchema } from "../schemas/entries";

export type EntryAuthor = z.infer<typeof entryAuthorSchema>;
export type EntryAuthorRef = string | EntryAuthor;

export type AuthorProfileKind = (typeof AUTHOR_PROFILE_FIELDS)[number];

export interface AuthorFields extends Partial<
  Record<AuthorProfileKind, string>
> {
  name: string;
  title?: string;
  bio?: string;
  avatar?: string;
  url?: string;
}

export type AuthorSocialKind = AuthorProfileKind | "website";

export interface AuthorSocial {
  kind: AuthorSocialKind;
  url: string;
}

export interface ResolvedAuthor {
  id: string | null;
  name: string;
  title?: string;
  bio?: string;
  avatar?: string;
  href?: string;
  links: string[];
  socials: AuthorSocial[];
  url?: string;
}

export interface AuthorAvatarProps {
  author: ResolvedAuthor;
  size?: number;
  class?: string;
  loading?: "eager" | "lazy";
}

export interface AuthorSocialsProps {
  socials: AuthorSocial[];
  class?: string;
}

export interface AuthorListProps {
  authors: ResolvedAuthor[];
}

export type ListedAuthor = ResolvedAuthor & { id: string };

export interface AuthorPageProps {
  author: ListedAuthor;
}
