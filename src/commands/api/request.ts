import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { ExitCode } from '../../constants/exit';
import { isBillableRequest } from '../../utils/billing';
import { confirmAction } from '../../utils/confirm';
import { readJsonFromFileOrStdin } from '../../utils/files';
import { parseKeyValuePairs, toQueryRecord } from '../../utils/key-value';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export default class ApiRequest extends NotraCommand {
  static override description = 'Send a direct request to a Notra API path.';
  static override examples = [
    '<%= config.bin %> api request GET /v1/status',
    '<%= config.bin %> api request GET /v1/posts --query limit=20',
    '<%= config.bin %> api request PATCH /v1/skills/writer --body-file ./patch.json',
  ];

  static override args = {
    method: Args.string({ description: 'HTTP method.', required: true, options: [...METHODS] }),
    path: Args.string({ description: 'API path beginning with /.', required: true }),
  };

  static override flags = {
    query: Flags.string({ description: 'Query parameter as NAME=VALUE. Repeatable.', multiple: true, default: [] }),
    'body-file': Flags.string({ description: 'JSON request body file, or "-" for stdin.' }),
    timeout: Flags.integer({ description: 'Request timeout in seconds.', min: 1, default: 30 }),
    yes: Flags.boolean({ char: 'y', description: 'Confirm billable requests without prompting.' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ApiRequest);
    if (!args.path.startsWith('/')) {
      this.error('API path must begin with /.', { exit: ExitCode.Usage });
    }
    if (isBillableRequest(args.method, args.path)) {
      const confirmed = await confirmAction(`Send billable request ${args.method} ${args.path}?`, {
        yes: flags.yes,
      });
      if (!confirmed) {
        this.error('Confirmation required. Re-run with --yes.', { exit: ExitCode.Usage });
      }
    }
    const query = toQueryRecord(parseKeyValuePairs(flags.query));
    const body = flags['body-file']
      ? await readJsonFromFileOrStdin(flags['body-file'], 'Expected a JSON request body.')
      : undefined;
    const result = await this.api().request(args.method, args.path, {
      query,
      body,
      timeoutMs: flags.timeout * 1000,
    });
    this.printJson(result);
  }
}
