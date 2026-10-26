export function mailtoAddress(href: string): string | undefined {
  const url = URL.parse(href);
  if (url?.protocol !== "mailto:") {
    return undefined;
  }
  try {
    const [first] = decodeURIComponent(url.pathname).split(",");
    return first?.trim() || undefined;
  } catch {
    return undefined;
  }
}
