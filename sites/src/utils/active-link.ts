export function activeLink(
  href: string,
  currentPath: string,
  publicOrigin: string
): "page" | "location" | undefined {
  let target: URL;
  try {
    target = new URL(href, publicOrigin);
  } catch {
    return undefined;
  }
  if (target.origin !== new URL(publicOrigin).origin || target.hash) {
    return undefined;
  }
  const path = target.pathname.replace(/\/+$/, "") || "/";
  const current = currentPath.replace(/\/+$/, "") || "/";
  if (path === current) {
    return "page";
  }
  return path !== "/" && current.startsWith(`${path}/`)
    ? "location"
    : undefined;
}
