import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ResolvedCommand } from "../types/cli";

const COMMAND_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function resolveCommand(
  values: ReadonlyArray<string>,
  commandsRoot: string,
  extension: ".ts" | ".js",
): ResolvedCommand | undefined {
  const candidates = commandCandidates(values);
  for (let length = candidates.length; length > 0; length -= 1) {
    const selected = candidates.slice(0, length);
    if (selected.some(({ value }) => !COMMAND_SEGMENT.test(value))) continue;
    const parts = selected.map(({ value }) => value);
    const file = join(commandsRoot, ...parts) + extension;
    if (existsSync(file)) {
      return {
        file,
        name: parts.join(" "),
        commandIndices: selected.map(({ index }) => index),
      };
    }
  }
  return undefined;
}

export function isCommandTopic(topic: string): boolean {
  return (
    topic === "" ||
    topic.split(" ").every((segment) => COMMAND_SEGMENT.test(segment))
  );
}

function commandCandidates(
  values: ReadonlyArray<string>,
): Array<{ index: number; value: string }> {
  const candidates: Array<{ index: number; value: string }> = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value) continue;
    if (value === "--api-key" || value === "--base-url") {
      index += 1;
      continue;
    }
    if (
      value === "--json" ||
      value.startsWith("--api-key=") ||
      value.startsWith("--base-url=")
    ) {
      continue;
    }
    if (!value.startsWith("-")) candidates.push({ index, value });
  }
  return candidates;
}
