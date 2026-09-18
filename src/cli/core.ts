import type {
  ArgDefinition,
  CommandConstructor,
  FlagDefinition,
  ParsedCommand,
} from '../types/cli';

export namespace Errors {
  export class CLIError extends Error {
    readonly oclif: { exit: number };

    constructor(message: string, options?: { exit?: number }) {
      super(message);
      this.name = 'CLIError';
      this.oclif = { exit: options?.exit ?? 1 };
    }
  }
}

export const Args = {
  string<const Options extends ArgDefinition = Record<never, never>>(
    options?: Options,
  ): ArgDefinition & Options {
    return (options ?? {}) as ArgDefinition & Options;
  },
};

export const Flags = {
  string<
    const Options extends Omit<FlagDefinition<string>, 'kind' | '__value'> = Record<never, never>,
  >(
    options?: Options,
  ): FlagDefinition<
    Options extends { multiple: true }
      ? string[]
      : Options extends { options: readonly (infer Value extends string)[] }
        ? Value
        : string
  > & Options {
    return { ...options, kind: 'string' } as FlagDefinition<
      Options extends { multiple: true }
        ? string[]
        : Options extends { options: readonly (infer Value extends string)[] }
          ? Value
          : string
    > & Options;
  },
  integer<
    const Options extends Omit<FlagDefinition<number>, 'kind' | '__value'> = Record<never, never>,
  >(
    options?: Options,
  ): FlagDefinition<Options extends { multiple: true } ? number[] : number> & Options {
    return { ...options, kind: 'integer' } as FlagDefinition<
      Options extends { multiple: true } ? number[] : number
    > & Options;
  },
  boolean<
    const Options extends Omit<FlagDefinition<boolean>, 'kind' | '__value'> = Record<never, never>,
  >(
    options?: Options,
  ): FlagDefinition<boolean> & Options {
    return { ...options, kind: 'boolean' } as FlagDefinition<boolean> & Options;
  },
};

export abstract class Command {
  static description?: string;
  static examples?: ReadonlyArray<string>;
  static args?: Record<string, ArgDefinition>;
  static flags?: Record<string, FlagDefinition>;
  static baseFlags?: Record<string, FlagDefinition>;

  constructor(protected readonly argv: string[] = []) {}

  public async init(): Promise<void> {}

  public abstract run(): Promise<void>;

  public async catch(error: unknown): Promise<unknown> {
    throw error;
  }

  protected async parse<const Constructor extends CommandConstructor>(
    command: Constructor,
  ): Promise<ParsedCommand<Constructor>> {
    const baseFlags = (Object.getPrototypeOf(command) as CommandConstructor).baseFlags ?? {};
    return parseArgv(
      this.argv,
      command.args ?? {},
      { ...baseFlags, ...(command.flags ?? {}) },
    ) as ParsedCommand<Constructor>;
  }

  protected log(message = ''): void {
    process.stdout.write(`${message}\n`);
  }

  protected logToStderr(message = ''): void {
    process.stderr.write(`${message}\n`);
  }

  protected error(message: string, options?: { exit?: number }): never {
    throw new Errors.CLIError(message, options);
  }
}

export function parseArgv(
  argv: ReadonlyArray<string>,
  argDefinitions: Record<string, ArgDefinition>,
  flagDefinitions: Record<string, FlagDefinition>,
): { args: Record<string, string | undefined>; flags: Record<string, unknown> } {
  const flags: Record<string, unknown> = {};
  const positionals: string[] = [];
  const provided = new Set<string>();
  const chars = new Map(
    Object.entries(flagDefinitions).flatMap(([name, definition]) =>
      definition.char ? [[definition.char, name] as const] : [],
    ),
  );

  for (const [name, definition] of Object.entries(flagDefinitions)) {
    if (definition.default !== undefined) flags[name] = definition.default;
    else if (definition.env && process.env[definition.env] !== undefined) {
      flags[name] = parseFlagValue(name, process.env[definition.env]!, definition);
    }
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]!;
    if (token === '--') {
      positionals.push(...argv.slice(index + 1));
      break;
    }
    if (!token.startsWith('-') || token === '-') {
      positionals.push(token);
      continue;
    }

    const equals = token.indexOf('=');
    const rawName = token.startsWith('--')
      ? token.slice(2, equals === -1 ? undefined : equals)
      : chars.get(token.slice(1, equals === -1 ? undefined : equals));
    if (!rawName) throw new Errors.CLIError(`Unknown flag: ${token}`, { exit: 2 });
    const negated = rawName.startsWith('no-');
    const name = negated ? rawName.slice(3) : rawName;
    const definition = flagDefinitions[name];
    if (!definition) throw new Errors.CLIError(`Unknown flag: --${rawName}`, { exit: 2 });

    let value: unknown;
    if (definition.kind === 'boolean') {
      if (negated && !definition.allowNo) {
        throw new Errors.CLIError(`Flag --${name} does not support --no-${name}.`, { exit: 2 });
      }
      value = !negated;
      if (equals !== -1) value = parseBoolean(token.slice(equals + 1), name);
    } else {
      if (negated) throw new Errors.CLIError(`Unknown flag: --${rawName}`, { exit: 2 });
      const rawValue = equals === -1 ? argv[++index] : token.slice(equals + 1);
      if (rawValue === undefined) {
        throw new Errors.CLIError(`Flag --${name} expects a value.`, { exit: 2 });
      }
      value = parseFlagValue(name, rawValue, definition);
    }
    provided.add(name);
    if (definition.multiple) {
      const items = typeof value === 'string' && definition.delimiter
        ? value.split(definition.delimiter)
        : [value];
      flags[name] = [...((flags[name] as unknown[]) ?? []), ...items];
    } else {
      flags[name] = value;
    }
  }

  for (const [name, definition] of Object.entries(flagDefinitions)) {
    if (definition.required && flags[name] === undefined) {
      throw new Errors.CLIError(`Missing required flag: --${name}`, { exit: 2 });
    }
    if (provided.has(name) && definition.exclusive) {
      const conflict = definition.exclusive.find((other) => provided.has(other));
      if (conflict) {
        throw new Errors.CLIError(`--${name} cannot be used with --${conflict}.`, { exit: 2 });
      }
    }
  }

  const args: Record<string, string | undefined> = {};
  const definitions = Object.entries(argDefinitions);
  for (let index = 0; index < definitions.length; index += 1) {
    const [name, definition] = definitions[index]!;
    const value = positionals[index];
    if (definition.required && value === undefined) {
      throw new Errors.CLIError(`Missing required argument: ${name}`, { exit: 2 });
    }
    if (value !== undefined && definition.options && !definition.options.includes(value)) {
      throw new Errors.CLIError(
        `Invalid ${name}: ${value}. Expected one of: ${definition.options.join(', ')}.`,
        { exit: 2 },
      );
    }
    args[name] = value;
  }
  if (positionals.length > definitions.length) {
    throw new Errors.CLIError(`Unexpected argument: ${positionals[definitions.length]}`, { exit: 2 });
  }
  return { args, flags };
}

function parseFlagValue(name: string, rawValue: string, definition: FlagDefinition): unknown {
  if (definition.kind === 'integer') {
    const value = Number(rawValue);
    if (!Number.isInteger(value)) {
      throw new Errors.CLIError(`--${name} must be an integer.`, { exit: 2 });
    }
    if (definition.min !== undefined && value < definition.min) {
      throw new Errors.CLIError(`--${name} must be at least ${definition.min}.`, { exit: 2 });
    }
    if (definition.max !== undefined && value > definition.max) {
      throw new Errors.CLIError(`--${name} must be at most ${definition.max}.`, { exit: 2 });
    }
    return value;
  }
  if (definition.options && !definition.options.includes(rawValue)) {
    throw new Errors.CLIError(
      `Invalid --${name}: ${rawValue}. Expected one of: ${definition.options.join(', ')}.`,
      { exit: 2 },
    );
  }
  return rawValue;
}

function parseBoolean(value: string, name: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Errors.CLIError(`--${name} expects true or false.`, { exit: 2 });
}
