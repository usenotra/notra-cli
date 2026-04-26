import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { confirmDestructive } from '../../utils/confirm';

export default class PostsDelete extends NotraCommand {
  static override description = 'Delete a post.';
  static override examples = [
    '<%= config.bin %> posts delete post_abc123',
    '<%= config.bin %> posts delete post_abc123 --yes',
  ];

  static override args = {
    postId: Args.string({ description: 'Post ID.', required: true }),
  };

  static override flags = {
    yes: Flags.boolean({ description: 'Skip the interactive confirmation.', char: 'y' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PostsDelete);
    const ok = await confirmDestructive(`Delete post ${args.postId}?`, { yes: flags.yes });
    if (!ok) this.error('Aborted.', { exit: 1 });
    const response = await this.client().content.deletePost({ postId: args.postId });
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    this.printSuccess(`Deleted post ${response.id}.`);
  }
}
