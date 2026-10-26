import type { BlogEntry, CardImages } from "../types/entries";
import { blogOptions } from "./options";

export function cardImages(entries: BlogEntry[]): CardImages {
  const setting = blogOptions.card.image;
  const anyImage = entries.some((entry) => Boolean(entry.data.image));
  if (setting === "auto") {
    return { show: anyImage, placeholder: false };
  }
  return { show: setting, placeholder: setting };
}
