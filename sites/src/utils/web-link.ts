/** Mirrors isWebLink in @notra/sites-core, which the theme can't import at runtime. */
export function webLink(value: string | undefined): string | undefined {
  const protocol = value ? URL.parse(value)?.protocol : undefined;
  return protocol === "http:" || protocol === "https:" ? value : undefined;
}
