import { Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { OPENAPI_OPERATIONS } from '../../constants/openapi';
import { renderTable } from '../../utils/output';
import type { OpenApiOperation } from '../../types/openapi';

export default class ApiOperations extends NotraCommand {
  static override description = 'List every operation in the bundled Notra OpenAPI catalog.';
  static override examples = [
    '<%= config.bin %> api operations',
    '<%= config.bin %> api operations --tag GEO',
    '<%= config.bin %> api operations --search feedback --json',
  ];

  static override flags = {
    tag: Flags.string({ description: 'Only show operations with this OpenAPI tag.' }),
    search: Flags.string({ description: 'Search operation IDs, summaries, methods, and paths.' }),
  };

  protected override requiresFreshAccessToken = false;

  public async run(): Promise<void> {
    const { flags } = await this.parse(ApiOperations);
    const needle = flags.search?.toLowerCase();
    const operations = OPENAPI_OPERATIONS.filter((operation) => {
      if (flags.tag && operation.tag.toLowerCase() !== flags.tag.toLowerCase()) return false;
      if (!needle) return true;
      return [operation.id, operation.summary, operation.method, operation.path, operation.tag]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });

    if (this.emitJson()) {
      this.printJson(operations);
      return;
    }
    this.log(
      renderTable<OpenApiOperation>(operations, {
        columns: [
          { header: 'Operation', get: (operation) => operation.id },
          { header: 'Method', get: (operation) => operation.method },
          { header: 'Path', get: (operation) => operation.path },
          { header: 'Tag', get: (operation) => operation.tag },
        ],
        empty: 'No matching API operations.',
      }),
    );
  }
}
