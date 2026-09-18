import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { BILLABLE_OPERATION_IDS } from '../../constants/billing';
import { OPENAPI_OPERATIONS } from '../../constants/openapi';
import { ExitCode } from '../../constants/exit';
import type { OpenApiOperation } from '../../types/openapi';
import { confirmAction } from '../../utils/confirm';
import { readJsonFromFileOrStdin } from '../../utils/files';
import { parseKeyValuePairs, toQueryRecord } from '../../utils/key-value';

export default class ApiCall extends NotraCommand {
  static override description = 'Call any endpoint by its OpenAPI operation ID.';
  static override examples = [
    '<%= config.bin %> api call getPublicApiStatus',
    '<%= config.bin %> api call getPost --param postId=post_123',
    '<%= config.bin %> api call listPosts --param limit=20 --param status=draft',
    '<%= config.bin %> api call createSkill --body-file ./skill.json',
  ];

  static override args = {
    operationId: Args.string({ description: 'OpenAPI operationId.', required: true }),
  };

  static override flags = {
    param: Flags.string({
      description: 'Path, query, or header parameter as NAME=VALUE. Repeatable.',
      multiple: true,
      default: [],
    }),
    'body-file': Flags.string({ description: 'JSON request body file, or "-" for stdin.' }),
    timeout: Flags.integer({ description: 'Request timeout in seconds.', min: 1, default: 30 }),
    yes: Flags.boolean({ char: 'y', description: 'Confirm billable operations without prompting.' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ApiCall);
    const operation: OpenApiOperation | undefined = OPENAPI_OPERATIONS.find(
      (candidate) => candidate.id === args.operationId,
    );
    if (!operation) {
      this.error(`Unknown operation ${args.operationId}. Run \`notra api operations\` to list IDs.`, {
        exit: ExitCode.Usage,
      });
    }

    const values = parseKeyValuePairs(flags.param);
    const declared = new Set<string>(operation.parameters.map((parameter) => parameter.name));
    const unknown = [...values.keys()].filter((name) => !declared.has(name));
    if (unknown.length > 0) {
      this.error(`Unknown parameter(s) for ${operation.id}: ${unknown.join(', ')}`, {
        exit: ExitCode.Usage,
      });
    }

    let path = operation.path;
    const query = new Map<string, string[]>();
    const headers: Record<string, string> = {};
    for (const parameter of operation.parameters) {
      const items = values.get(parameter.name) ?? [];
      if (parameter.required && items.length === 0) {
        this.error(`Missing required parameter: ${parameter.name}`, { exit: ExitCode.Usage });
      }
      if (parameter.in === 'path' && items[0] !== undefined) {
        path = path.replace(`{${parameter.name}}`, encodeURIComponent(items[0]));
      } else if (parameter.in === 'query' && items.length > 0) {
        query.set(parameter.name, items);
      } else if (parameter.in === 'header' && items[0] !== undefined) {
        headers[parameter.name] = items[0];
      }
    }

    if (operation.hasBody && !flags['body-file']) {
      this.error(`${operation.id} requires --body-file.`, { exit: ExitCode.Usage });
    }
    if (!operation.hasBody && flags['body-file']) {
      this.error(`${operation.id} does not accept a request body.`, { exit: ExitCode.Usage });
    }
    const body = flags['body-file']
      ? await readJsonFromFileOrStdin(flags['body-file'], 'Expected a JSON request body.')
      : undefined;
    if (BILLABLE_OPERATION_IDS.has(operation.id)) {
      const confirmed = await confirmAction(`Run billable operation ${operation.id}?`, {
        yes: flags.yes,
      });
      if (!confirmed) {
        this.error('Confirmation required. Re-run with --yes.', { exit: ExitCode.Usage });
      }
    }
    const result = await this.api().request(operation.method, path, {
      query: toQueryRecord(query),
      headers,
      body,
      timeoutMs: flags.timeout * 1000,
    });
    this.printJson(result);
  }
}
