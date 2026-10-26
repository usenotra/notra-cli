export interface BlogCategory {
  name: string;
  slug: string;
}

export interface CategoryBarProps {
  categories: BlogCategory[];
  search?: boolean;
  class?: string;
}
