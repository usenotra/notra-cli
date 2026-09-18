export function parseKeyValuePairs(values: ReadonlyArray<string>): Map<string, string[]> {
  const pairs = new Map<string, string[]>();
  for (const value of values) {
    const separator = value.indexOf('=');
    if (separator <= 0) throw new Error(`Expected NAME=VALUE, received ${JSON.stringify(value)}.`);
    const name = value.slice(0, separator);
    const item = value.slice(separator + 1);
    pairs.set(name, [...(pairs.get(name) ?? []), item]);
  }
  return pairs;
}

export function toQueryRecord(
  pairs: ReadonlyMap<string, ReadonlyArray<string>>,
): Record<string, string | string[]> {
  return Object.fromEntries(
    [...pairs].map(([name, values]) => [
      name,
      values.length === 1 ? values[0] ?? '' : [...values],
    ]),
  );
}
