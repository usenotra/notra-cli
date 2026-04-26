import { Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import type { ListPostsRequest, ListPostsPost } from '../../types/api';
import { formatDate, renderTable, truncate } from '../../utils/output';

export default class PostsList extends NotraCommand {
  static override description = 'List posts in the current organization.';
  static override examples = [
    '<%= config.bin %> posts list',
    '<%= config.bin %> posts list --status draft --limit 10',
    '<%= config.bin %> posts list --json',
  ];

  static override flags = {
    status: Flags.string({ description: 'Comma-separated list of statuses (draft, published).' }),
    'content-type': Flags.string({
      description: 'Comma-separated list of content types (changelog, blog_post, ...).',
    }),
    brand: Flags.string({ description: 'Filter by brand identity ID.' }),
    limit: Flags.integer({ description: 'Items per page.', min: 1, max: 100 }),
    page: Flags.integer({ description: 'Page number.', min: 1 }),
    sort: Flags.string({ description: 'Sort by creation date.', options: ['asc', 'desc'] }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(PostsList);

    const request: ListPostsRequest = {};
    if (flags.status) request.status = flags.status;
    if (flags['content-type']) request.contentType = flags['content-type'];
    if (flags.brand) request.brandIdentityId = flags.brand;
    if (flags.limit !== undefined) request.limit = flags.limit;
    if (flags.page !== undefined) request.page = flags.page;
    if (flags.sort) request.sort = flags.sort as 'asc' | 'desc';

    const response = await this.client().content.listPosts(request);

    if (this.emitJson()) {
      this.printJson(response);
      return;
    }

    this.log(
      renderTable<ListPostsPost>(response.posts, {
        columns: [
          { header: 'ID', get: (p) => p.id },
          { header: 'Title', get: (p) => truncate(p.title, 40) },
          { header: 'Type', get: (p) => p.contentType },
          { header: 'Status', get: (p) => p.status },
          { header: 'Updated', get: (p) => formatDate(p.updatedAt) },
        ],
      }),
    );
    const { pagination } = response;
    this.log(
      `\nPage ${pagination.currentPage} of ${pagination.totalPages} ` +
        `(${pagination.totalItems} total)`,
    );
  }
}
