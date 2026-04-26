import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { readMarkdownFromFileOrStdin } from '../../utils/files';
import type { UpdatePostRequest } from '../../types/api';

export default class PostsUpdate extends NotraCommand {
  static override description = 'Update a post (title, slug, markdown, status).';
  static override examples = [
    '<%= config.bin %> posts update post_abc123 --title "New title" --status published',
    '<%= config.bin %> posts update post_abc123 --markdown-file ./post.md',
    'cat post.md | <%= config.bin %> posts update post_abc123 --markdown-file -',
  ];

  static override args = {
    postId: Args.string({ description: 'Post ID.', required: true }),
  };

  static override flags = {
    title: Flags.string({ description: 'New title.' }),
    slug: Flags.string({ description: 'New slug. Pass empty string to clear.' }),
    'markdown-file': Flags.string({
      description: 'Path to a markdown file. Use "-" to read from stdin.',
    }),
    status: Flags.string({
      description: 'New status.',
      options: ['draft', 'published'],
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PostsUpdate);

    const body: UpdatePostRequest['body'] = {};
    if (flags.title !== undefined) body.title = flags.title;
    if (flags.slug !== undefined) body.slug = flags.slug === '' ? null : flags.slug;
    if (flags.status) body.status = flags.status as 'draft' | 'published';
    if (flags['markdown-file'] !== undefined) {
      body.markdown = await readMarkdownFromFileOrStdin(flags['markdown-file']);
    }

    if (Object.keys(body).length === 0) {
      this.error('Provide at least one field to update.', { exit: 2 });
    }

    const response = await this.client().content.updatePost({ postId: args.postId, body });

    if (this.emitJson()) {
      this.printJson(response.result);
      return;
    }
    this.printSuccess(`Updated post ${response.result.post.id}.`);
  }
}
