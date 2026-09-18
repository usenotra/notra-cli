export type FlagKind = "string" | "integer" | "boolean";

export type FlagDefinition<Value = unknown> = {
  kind: FlagKind;
  description?: string;
  required?: boolean;
  options?: readonly string[];
  multiple?: boolean;
  delimiter?: string;
  default?: unknown;
  min?: number;
  max?: number;
  char?: string;
  env?: string;
  allowNo?: boolean;
  exclusive?: readonly string[];
  helpGroup?: string;
  readonly __value?: Value;
};

export type ArgDefinition = {
  description?: string;
  required?: boolean;
  options?: readonly string[];
};

export type CommandConstructor = {
  args?: Record<string, ArgDefinition>;
  flags?: Record<string, FlagDefinition<unknown>>;
  baseFlags?: Record<string, FlagDefinition<unknown>>;
};

type InferArgs<Definition> =
  Definition extends Record<string, ArgDefinition>
    ? {
        [Key in keyof Definition]: Definition[Key] extends {
          options: readonly (infer Value extends string)[];
        }
          ? Definition[Key] extends { required: true }
            ? Value
            : Value | undefined
          : Definition[Key] extends { required: true }
            ? string
            : string | undefined;
      }
    : Record<never, never>;

type InferFlags<Definition> =
  Definition extends Record<string, FlagDefinition<unknown>>
    ? {
        [Key in keyof Definition]: Definition[Key] extends FlagDefinition<
          infer Value
        >
          ? Definition[Key] extends { required: true } | { default: unknown }
            ? Value
            : Value | undefined
          : never;
      }
    : Record<never, never>;

export type ParsedCommand<Constructor> = {
  args: Constructor extends { args: infer Definition }
    ? InferArgs<Definition>
    : Record<never, never>;
  flags: Constructor extends { flags: infer Definition }
    ? InferFlags<Definition>
    : Record<never, never>;
};

export type ResolvedCommand = {
  file: string;
  name: string;
  commandIndices: number[];
};
