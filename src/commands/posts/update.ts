import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { ExitCode } from '../../constants/exit';
import { POST_STATUSES } from '../../constants/posts';
import { validateUpdatePostBody } from '../../schemas/posts';
import { readTextFromFileOrStdin } from '../../utils/files';

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
      options: [...POST_STATUSES],
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PostsUpdate);

    const body: Record<string, unknown> = {};
    if (flags.title !== undefined) body.title = flags.title;
    if (flags.slug !== undefined) body.slug = flags.slug === '' ? null : flags.slug;
    if (flags.status) body.status = flags.status;
    if (flags['markdown-file'] !== undefined) {
      body.markdown = await readTextFromFileOrStdin(
        flags['markdown-file'],
        'Expected markdown via --markdown-file or piped on stdin.',
      );
    }

    if (Object.keys(body).length === 0) {
      this.error('Provide at least one field to update.', { exit: ExitCode.Usage });
    }
    const validatedBody = validateUpdatePostBody(body);

    const response = await this.client().content.updatePost({
      postId: args.postId,
      body: validatedBody,
    });

    if (this.emitJson()) {
      this.printJson(response.result);
      return;
    }
    this.printSuccess(`Updated post ${response.result.post.id}.`);
  }
}
