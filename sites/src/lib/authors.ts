import { AUTHOR_PROFILE_FIELDS } from "../constants/authors";
import type {
  AuthorFields,
  AuthorSocial,
  EntryAuthorRef,
  ResolvedAuthor,
} from "../types/authors";
import type { BlogEntry, ChangelogEntry } from "../types/entries";
import { mergeAuthorFields } from "../utils/merge-author-fields";
import { webLink } from "../utils/web-link";
import { absoluteUrl, assetUrl, config, href } from "./params";

function configAuthor(id: string): AuthorFields | undefined {
  return Object.hasOwn(config.authors, id) ? config.authors[id] : undefined;
}

function authorHref(id: string): string {
  return href(`author/${id}`);
}

function resolved(id: string | null, author: AuthorFields): ResolvedAuthor {
  // blog.json takes any scheme for older link fields; the author_link_scheme warning explains the dropped ones.
  const website = webLink(author.url);
  const profiles = AUTHOR_PROFILE_FIELDS.flatMap((kind) => {
    const url = webLink(author[kind]);
    return url ? [{ kind, url }] : [];
  });
  const links = [
    ...(website ? [website] : []),
    ...profiles.map((profile) => profile.url),
  ];
  const socials: AuthorSocial[] = website
    ? [...profiles, { kind: "website", url: website }]
    : profiles;
  return {
    id,
    name: author.name,
    title: author.title,
    bio: author.bio,
    avatar: assetUrl(author.avatar),
    href: id ? authorHref(id) : undefined,
    links,
    socials,
    url: website ?? links[0],
  };
}

function resolveAuthor(value: EntryAuthorRef): ResolvedAuthor {
  if (typeof value === "string") {
    const known = configAuthor(value);
    return known
      ? resolved(value, known)
      : { id: null, name: value, links: [], socials: [] };
  }
  const { id, ...fields } = value;
  if (!id) {
    return resolved(null, fields);
  }
  return resolved(id, mergeAuthorFields(fields, configAuthor(id)));
}

function authorRefs(entry: BlogEntry): EntryAuthorRef[] {
  const author = entry.data.author;
  if (!author) {
    return [];
  }
  return Array.isArray(author) ? author : [author];
}

export function authorsOf(
  entry: BlogEntry,
  listedEntries?: BlogEntry[]
): ResolvedAuthor[] {
  return authorRefs(entry).map((ref) => {
    const author = resolveAuthor(ref);
    if (
      listedEntries &&
      !listedEntries.some((listed) => authoredBy(listed, author.id))
    ) {
      author.href = undefined;
    }
    return author;
  });
}

export function authorNamesOf(entry: BlogEntry | ChangelogEntry): string[] {
  return entry.collection === "blog"
    ? authorsOf(entry).map((author) => author.name)
    : [];
}

export function allAuthors(entries: BlogEntry[]): ResolvedAuthor[] {
  const inline = new Map<string, AuthorFields>();
  for (const entry of entries) {
    for (const ref of authorRefs(entry)) {
      if (typeof ref === "string" || !ref.id) {
        continue;
      }
      const { id, ...fields } = ref;
      const newer = inline.get(id);
      inline.set(id, newer ? mergeAuthorFields(fields, newer) : fields);
    }
  }
  const known = Object.entries(config.authors).map(([id, author]) =>
    resolved(id, mergeAuthorFields(inline.get(id) ?? author, author))
  );
  const inlineOnly = [...inline]
    .filter(([id]) => !configAuthor(id))
    .map(([id, author]) => resolved(id, author));
  return [...known, ...inlineOnly];
}

export function authoredBy(entry: BlogEntry, id: string | null): boolean {
  return authorsOf(entry).some((byline) => byline.id === id);
}

export function personNode(author: ResolvedAuthor) {
  return {
    "@type": "Person",
    name: author.name,
    url: author.href ? absoluteUrl(author.href) : author.url,
    image: author.avatar ? absoluteUrl(author.avatar) : undefined,
    jobTitle: author.title,
    description: author.bio,
    sameAs: author.links.length > 0 ? author.links : undefined,
  };
}
