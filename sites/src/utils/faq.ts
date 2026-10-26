import { FAQ_HEADING } from "../constants/seo";
import type { FaqEntry } from "../types/seo";
import { parseBody, plainText } from "./excerpt";

const collapse = (text: string) => text.replace(/\s+/g, " ").trim();

export function faqEntries(body: string | undefined): FaqEntry[] {
  if (!body) {
    return [];
  }
  const entries: FaqEntry[] = [];
  let inFaq = false;
  let current: { question: string; answer: string[] | null } | undefined;
  const flush = () => {
    const answer = collapse(current?.answer?.join(" ") ?? "");
    if (current && answer) {
      entries.push({ question: current.question, answer });
    }
    current = undefined;
  };
  for (const node of parseBody(body).children) {
    if (node.type === "heading" && node.depth <= 2) {
      flush();
      inFaq =
        node.depth === 2 &&
        FAQ_HEADING.test(collapse(node.children.map(plainText).join("")));
      continue;
    }
    if (!inFaq) {
      continue;
    }
    if (node.type === "heading" && node.depth === 3) {
      flush();
      const question = collapse(node.children.map(plainText).join(""));
      current = question ? { question, answer: [] } : undefined;
    } else if (node.type === "paragraph" && current) {
      current.answer?.push(plainText(node));
    } else if (current && node.type !== "definition") {
      current.answer = null;
    }
  }
  flush();
  return entries;
}
