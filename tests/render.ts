import { isValidElement, type ReactElement } from "react";
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

/**
 * Keys that repeat among siblings in an element tree, without rendering child components.
 * Server rendering doesn't warn about duplicate keys, so tests check the tree directly.
 */
export function duplicateKeys(node: unknown): string[] {
  if (Array.isArray(node)) {
    const keys = node
      .filter(isValidElement)
      .map((child) => child.key)
      .filter((key): key is string => key !== null);
    const repeated = keys.filter((key, i) => keys.indexOf(key) !== i);
    return [...repeated, ...node.flatMap(duplicateKeys)];
  }
  if (!isValidElement(node)) return [];
  return duplicateKeys((node.props as { children?: unknown }).children);
}
