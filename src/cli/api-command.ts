import { NotraCommand } from '../base-command';
import { BILLABLE_OPERATION_IDS } from '../constants/billing';
import { API_ACTION_CONFIRMATIONS } from '../constants/api-commands';
import { ExitCode } from '../constants/exit';
import type { ApiCommandOptions } from '../types/api-command';
import {
  getOperation,
  operationArgs,
  operationFlags,
  prepareOperation,
  readOperationBody,
} from '../utils/api-command';
import { operationBodySchema } from '../schemas/api-command';
import { confirmAction } from '../utils/confirm';
import { parseChatStream } from '../utils/chat-stream';

export function createApiCommand(id: string, options: ApiCommandOptions = {}): typeof NotraCommand {
  const spec = getOperation(id);
  if (options.bodySchema && !spec.schema.body) throw new Error(`Operation ${id} has no request body to override.`);
  const definitions = operationFlags(spec);
  const bodyValidator = options.bodySchema ?? (spec.schema.body ? operationBodySchema(id) : undefined);
  const response = options.response ?? 'json';
  for (const [name, value] of Object.entries(options.defaults ?? {})) {
    const definition = definitions[name];
    if (!definition) throw new Error(`Unknown default flag for ${id}: ${name}`);
    definitions[name] = { ...definition, default: value };
  }
  return class ApiCommand extends NotraCommand {
    static override description = options.description ?? spec.operation.summary;
    static override args = operationArgs(spec);
    static override flags = definitions;

    protected override requiresFreshAccessToken = !options.public;
    protected override usesNdjson = response === 'ndjson';

    public async run(): Promise<void> {
      const { args, flags } = await this.parse(ApiCommand);
      const body = bodyValidator ? await readOperationBody(spec, flags, bodyValidator) : undefined;
      const prepared = prepareOperation(spec, args, flags, body);
      if (spec.operation.method === 'DELETE' || BILLABLE_OPERATION_IDS.has(id)) {
        const confirmed = await confirmAction(
          API_ACTION_CONFIRMATIONS[id] ?? `${spec.operation.summary}?`,
          { yes: flags.yes === true },
        );
        if (!confirmed) {
          this.error('Confirmation required. Re-run with --yes.', { exit: ExitCode.Usage });
        }
      }
      const client = options.public ? this.api() : this.authenticatedApi();
      const request = { ...prepared, timeoutMs: Number(flags.timeout) * 1000 };
      if (response === 'ndjson') {
        for await (const event of client.stream(spec.operation.method, prepared.path, request)) {
          this.printJson(event);
        }
        return;
      }
      const result = await client.request(spec.operation.method, prepared.path, request);
      this.printJson(response === 'chat' && typeof result === 'string' ? parseChatStream(result) : result);
    }
  };
}
