import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** Render a Server Component tree to HTML, plus its visible text with whitespace collapsed. */
export function render(element: ReactElement | null): { html: string; text: string } {
  const html = element === null ? "" : renderToStaticMarkup(element);
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return { html, text };
}

/** Count elements carrying an attribute, e.g. count(html, 'role="meter"'). */
export function count(html: string, needle: string): number {
  return html.split(needle).length - 1;
}
