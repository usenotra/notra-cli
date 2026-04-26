import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { formatDate, renderKv } from '../../utils/output';

export default class PostsGet extends NotraCommand {
  static override description = 'Fetch a single post by ID.';
  static override examples = [
    '<%= config.bin %> posts get post_abc123',
    '<%= config.bin %> posts get post_abc123 --markdown',
  ];

  static override args = {
    postId: Args.string({ description: 'Post ID.', required: true }),
  };

  static override flags = {
    markdown: Flags.boolean({ description: 'Print only the post markdown to stdout.' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PostsGet);
    const response = await this.client().content.getPost({ postId: args.postId });

    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    if (!response.post) {
      this.error('Post not found.', { exit: 5 });
    }
    if (flags.markdown) {
      this.log(response.post.markdown);
      return;
    }

    this.log(
      renderKv([
        ['ID', response.post.id],
        ['Title', response.post.title],
        ['Slug', response.post.slug ?? '—'],
        ['Type', response.post.contentType],
        ['Status', response.post.status],
        ['Created', formatDate(response.post.createdAt)],
        ['Updated', formatDate(response.post.updatedAt)],
      ]),
    );
  }
}
