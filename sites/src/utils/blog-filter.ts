export function matchesBlogFilter(
  categories: string,
  text: string,
  category: string,
  query: string
): boolean {
  return (
    (!category || categories.split(" ").includes(category)) &&
    text.toLowerCase().includes(query.trim().toLowerCase())
  );
}
