import type { z } from "astro/zod";

import type { entryAuthorSchema } from "../schemas/entries";

export type EntryAuthor = z.infer<typeof entryAuthorSchema>;
export type EntryAuthorRef = string | EntryAuthor;

export interface AuthorFields {
  name: string;
  title?: string;
  bio?: string;
  avatar?: string;
  url?: string;
  x?: string;
  linkedin?: string;
  github?: string;
  youtube?: string;
}

export type AuthorSocialKind =
  | "x"
  | "linkedin"
  | "github"
  | "youtube"
  | "website";

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

export interface AuthorListProps {
  authors: ResolvedAuthor[];
}

export interface AuthorPageProps {
  author: ResolvedAuthor;
}
