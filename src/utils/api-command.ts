import { Errors, Flags } from '../cli/core';
import { OPENAPI_OPERATIONS, OPENAPI_REQUEST_SCHEMAS } from '../constants/openapi';
import { API_QUERY_PARAMETER_SCHEMAS } from '../constants/api-commands';
import type { ArgDefinition, FlagDefinition } from '../types/cli';
import type { OperationWithSchema, PreparedOperation } from '../types/api-command';
import type { JSONSchema } from 'zod/v4/core';
import { fromJSONSchema, type ZodType } from 'zod';
import { parseApiRequest } from './parse-api-request';
import { readJsonFromFileOrStdin, readTextFromFileOrStdin } from './files';
import { ExitCode } from '../constants/exit';
import { isRecord } from './records';

export function getOperation(id: string): OperationWithSchema {
  const operation = OPENAPI_OPERATIONS.find((candidate) => candidate.id === id);
  const schema = OPENAPI_REQUEST_SCHEMAS[id];
  if (!operation || !schema) throw new Error(`Unknown bundled operation: ${id}`);
  const extraParameters = API_QUERY_PARAMETER_SCHEMAS[id] ?? {};
  return {
    operation: {
      ...operation,
      parameters: [...operation.parameters, ...Object.keys(extraParameters).map((name) => ({ name, in: 'query' as const, required: false }))],
    },
    schema: { ...schema, parameters: { ...schema.parameters, ...extraParameters } },
  };
}

export function apiFlagName(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function operationArgs({ operation }: OperationWithSchema): Record<string, ArgDefinition> {
  return Object.fromEntries(operation.parameters.filter((parameter) => parameter.in === 'path')
    .map((parameter) => [parameter.name, { required: true, description: parameter.name }]));
}

export function operationFlags(spec: OperationWithSchema): Record<string, FlagDefinition> {
  const flags: Record<string, FlagDefinition> = {
    timeout: Flags.integer({ min: 1, default: 30, description: 'Request timeout in seconds.' }),
    yes: Flags.boolean({ char: 'y', description: 'Confirm destructive or billable actions.' }),
  };
  for (const parameter of spec.operation.parameters) {
    if (parameter.in === 'path') continue;
    flags[apiFlagName(parameter.name)] = schemaFlag(spec.schema.parameters[parameter.name] ?? {}, parameter.name);
  }
  if (spec.schema.body) {
    flags['body-file'] = Flags.string({ description: 'JSON request body file, or "-" for stdin. Field flags override it.' });
    for (const [name, schema] of Object.entries(spec.schema.body.properties ?? {})) {
      const flag = bodyFlagName(spec, name);
      flags[flag] = schemaFlag(schema, name);
      if (spec.schema.body.required?.includes(name)) flags[flag]!.description += ' Required unless set in --body-file.';
      if (['content', 'markdown', 'message'].includes(name)) {
        flags[`${flag}-file`] = Flags.string({ description: `Read ${name} from a UTF-8 file, or "-" for stdin.`, exclusive: [flag] });
        flags[flag]!.exclusive = [`${flag}-file`];
      }
    }
  }
  return flags;
}

export function bodyFlagName(spec: OperationWithSchema, name: string): string {
  // Updating a skill can rename it; its current name is already a positional argument.
  return spec.operation.parameters.some((parameter) => parameter.in === 'path' && parameter.name === name)
    ? `new-${apiFlagName(name)}` : apiFlagName(name);
}

function schemaFlag(input: JSONSchema._JSONSchema, name: string): FlagDefinition {
  const schema = typeof input === 'boolean' ? {} : input;
  const type = schemaType(schema);
  const description = schema.description ?? name;
  if (type === 'boolean') return Flags.boolean({ description, allowNo: true });
  if (type === 'integer') return Flags.integer({ description, min: schema.minimum, max: schema.maximum });
  if (type === 'array' && isRecord(schema.items) && schema.items.type === 'string') {
    return Flags.string({ description: `${description} Repeatable.`, multiple: true });
  }
  return Flags.string({ description: type === 'object' || type === 'array' ? `${description} Pass JSON.` : description });
}

export function schemaType(schema: JSONSchema.JSONSchema): string | undefined {
  return schema.type ?? schema.anyOf?.map(schemaType).find((type) => type !== 'null');
}

export function parseSchemaValue(value: unknown, input: JSONSchema._JSONSchema): unknown {
  const schema = typeof input === 'boolean' ? {} : input;
  const type = schemaType(schema);
  if (typeof value !== 'string') return value;
  if (type === 'number' || type === 'integer') return value.trim() ? Number(value) : value;
  if (type === 'boolean') return value === 'true' ? true : value === 'false' ? false : value;
  if (type === 'object' || type === 'array') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

export function prepareOperation(
  spec: OperationWithSchema,
  args: Record<string, string | undefined>,
  flags: Record<string, unknown>,
  body?: unknown,
): PreparedOperation {
  let path = spec.operation.path;
  const query: PreparedOperation['query'] = {};
  const headers: Record<string, string> = {};
  for (const parameter of spec.operation.parameters) {
    const value = parameter.in === 'path' ? args[parameter.name] : flags[apiFlagName(parameter.name)];
    if (value === undefined && !parameter.required) continue;
    const schema = spec.schema.parameters[parameter.name] ?? {};
    const validated = parseApiRequest(fromJSONSchema(schema), parseSchemaValue(value, schema), `Invalid ${parameter.name}`);
    if (parameter.in === 'path') path = path.replace(`{${parameter.name}}`, encodeURIComponent(String(validated)));
    else if (parameter.in === 'header') headers[parameter.name] = String(validated);
    else query[parameter.name] = validated as PreparedOperation['query'][string];
  }
  return { path, query, headers, body };
}

export async function readOperationBody(
  spec: OperationWithSchema,
  flags: Record<string, unknown>,
  validator: ZodType,
): Promise<unknown> {
  const body: unknown = flags['body-file']
    ? await readJsonFromFileOrStdin(String(flags['body-file']), 'Expected a JSON request body.') : {};
  if (!isRecord(body)) throw new Errors.CLIError('Request body must be a JSON object.', { exit: ExitCode.Usage });
  for (const [name, schema] of Object.entries(spec.schema.body?.properties ?? {})) {
    const flag = bodyFlagName(spec, name);
    if (flags[flag] !== undefined) body[name] = parseSchemaValue(flags[flag], schema);
    if (flags[`${flag}-file`] !== undefined) {
      body[name] = await readTextFromFileOrStdin(String(flags[`${flag}-file`]), `Expected ${name} content.`);
    }
  }
  return parseApiRequest(validator, body, `Invalid ${spec.operation.id} request`);
}
