import type { SiteConfig } from "@notra/sites-core/types/site-config";

import type { LinkIcon } from "./icons";

export type NavbarItem = SiteConfig["navbar"]["links"][number];
export type NavbarLink = Exclude<NavbarItem, { items: unknown }>;

export interface NavbarArea {
  label: string;
  href: string;
  active: boolean;
}

export interface SiteAreasProps {
  sections?: NavbarArea[];
}

export interface ResolvedDropdown {
  label: string;
  icon?: LinkIcon;
  items: ResolvedLink[];
}

export interface NavbarItemProps {
  item: ResolvedLink | ResolvedDropdown;
  mobile?: boolean;
}

export interface NavbarLinkProps {
  link: ResolvedLink;
  mobile?: boolean;
  dropdown?: boolean;
}

export interface PlainLink {
  label: string;
  href: string;
  icon?: string;
}

export interface ResolvedLink {
  label: string;
  href: string;
  icon?: LinkIcon;
  iconOnly: boolean;
}

export interface FooterColumn {
  header?: string;
  items: ResolvedLink[];
}

export interface BackLinkProps {
  href: string;
  label: string;
}
