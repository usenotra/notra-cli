import { z } from "astro/zod";

import { AUTHOR_AVATAR, AUTHOR_ID, HTTP_PROTOCOL } from "../constants/entries";

const linkSchema = z.url({
  protocol: HTTP_PROTOCOL,
  error: "Use a full http(s):// URL",
});

export const entryAuthorSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(AUTHOR_ID, "Use lowercase letters, digits and dashes for author ids")
    .optional(),
  name: z.string().trim().min(1),
  title: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  avatar: z
    .string()
    .trim()
    .regex(AUTHOR_AVATAR, "Use a path like /images/jan.jpg or an https:// URL")
    .optional(),
  url: linkSchema.optional(),
  x: linkSchema.optional(),
  linkedin: linkSchema.optional(),
  github: linkSchema.optional(),
  youtube: linkSchema.optional(),
});

const authorRefSchema = z.union([z.string(), entryAuthorSchema]);

export const blogEntrySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  author: z.union([authorRefSchema, z.array(authorRefSchema)]).optional(),
  image: z.string().optional(),
  imageAlt: z.string().trim().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  hidden: z.boolean().default(false),
  noindex: z.boolean().default(false),
});

export const changelogEntrySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  date: z.coerce.date(),
  version: z.string().trim().optional(),
  tags: z.array(z.string()).default([]),
  image: z.string().optional(),
  imageAlt: z.string().trim().optional(),
  draft: z.boolean().default(false),
  hidden: z.boolean().default(false),
});
