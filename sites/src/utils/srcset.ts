import type { SrcsetCandidate } from "../types/srcset";

const isSpace = (char: string | undefined) =>
  char === " " ||
  char === "\t" ||
  char === "\n" ||
  char === "\f" ||
  char === "\r";

/**
 * The candidates of a srcset, read like the HTML parser: a URL runs to the next
 * whitespace, so data: URLs and query strings keep their commas, and its
 * descriptors run to the next comma outside parentheses. Same as
 * `@notra/sites-compiler/utils/srcset`; src/ ships without workspace packages.
 */
export function srcsetCandidates(srcset: string): SrcsetCandidate[] {
  const candidates: SrcsetCandidate[] = [];
  let position = 0;
  while (position < srcset.length) {
    while (isSpace(srcset[position]) || srcset[position] === ",") {
      position += 1;
    }
    const start = position;
    while (position < srcset.length && !isSpace(srcset[position])) {
      position += 1;
    }
    let end = position;
    if (srcset[end - 1] === ",") {
      while (end > start && srcset[end - 1] === ",") {
        end -= 1;
      }
    } else {
      let inParentheses = false;
      while (position < srcset.length) {
        const char = srcset[position];
        position += 1;
        if (char === "(" || char === ")") {
          inParentheses = char === "(";
        } else if (char === "," && !inParentheses) {
          break;
        }
      }
    }
    if (end > start) {
      candidates.push({ url: srcset.slice(start, end), start, end });
    }
  }
  return candidates;
}
