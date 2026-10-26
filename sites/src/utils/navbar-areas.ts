import type { SiteArea, SiteMounts } from "@notra/sites-core/types/deployment";
import type { SiteConfig } from "@notra/sites-core/types/site-config";

import { AREA_DEFAULT_TITLES } from "../constants/areas";
import type { NavbarArea } from "../types/navigation";

export function resolveNavbarAreas(
  configured: SiteConfig["navbar"]["areas"],
  automatic: SiteArea[],
  mounts: SiteMounts,
  currentArea: SiteArea
): NavbarArea[] {
  const areas = configured ?? automatic.map((area) => ({ area }));
  const sections = areas.flatMap((item) => {
    const mount = mounts[item.area];
    return mount
      ? [
          {
            label:
              ("label" in item ? item.label : undefined) ??
              AREA_DEFAULT_TITLES[item.area],
            href: mount,
            active: item.area === currentArea,
          },
        ]
      : [];
  });
  return configured === undefined && sections.length < 2 ? [] : sections;
}
