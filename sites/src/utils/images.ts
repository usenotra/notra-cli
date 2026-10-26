import { IMAGE_MIME_TYPES, IMAGE_URL_EXTENSION } from "../constants/seo";

export function imageMimeType(url: string): string | undefined {
  const { pathname } = new URL(url);
  const extension = IMAGE_URL_EXTENSION.exec(pathname)?.[1]?.toLowerCase();
  return extension && Object.hasOwn(IMAGE_MIME_TYPES, extension)
    ? IMAGE_MIME_TYPES[extension]
    : undefined;
}
