import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

export function starterSiteFiles(name: string, date: string): Record<string, string> {
  return {
    'blog.json': `${JSON.stringify(
      {
        $schema: 'https://usenotra.com/schemas/blog.json',
        name,
        description: `News and updates from ${name}.`,
        blog: { title: 'Blog', description: 'Notes, guides and announcements.' },
        changelog: { title: 'Changelog', description: 'Everything we shipped.' },
      },
      null,
      2,
    )}\n`,
    'blog/hello-world.mdx': `---
title: "Hello world"
description: "Your first post on Notra Sites."
date: ${date}
tags: [welcome]
---

This post lives in \`blog/hello-world.mdx\`. Edit it and save: the preview reloads on its own.

<Tip>Posts are Markdown or MDX. The front matter sets the title, description, date and tags.</Tip>

## Next steps

<Steps>
  <Step title="Write">Add a \`.mdx\` file to \`blog/\` or \`changelog/\`.</Step>
  <Step title="Make it yours">Set your name, logo, colors and navigation in \`blog.json\`.</Step>
  <Step title="Publish">Push this folder to GitHub and connect the repository in Notra.</Step>
</Steps>
`,
    [`changelog/${date}-first-release.mdx`]: `---
title: "First release"
date: ${date}
version: v1.0.0
tags: [Feature]
---

Our changelog is live. <Badge>New</Badge>

- The blog is at \`/blog\`
- The changelog is at \`/changelog\`
`,
  };
}

/** Writes every starter file or none, never overwriting one that already exists. */
export async function createStarterSite(source: string, today = new Date()): Promise<{ root: string; files: string[] }> {
  const root = resolve(source);
  const name = basename(root).trim().slice(0, 80).trim() || 'My site';
  const files = starterSiteFiles(name, today.toISOString().slice(0, 10));
  const created: string[] = [];
  try {
    for (const [path, content] of Object.entries(files)) {
      const target = join(root, path);
      const directory = await mkdir(dirname(target), { recursive: true });
      if (directory) created.push(directory);
      await writeFile(target, content, { flag: 'wx' });
      created.push(target);
    }
  } catch (error) {
    await Promise.all(created.map((path) => rm(path, { recursive: true, force: true })));
    throw error;
  }
  return { root, files: Object.keys(files) };
}
