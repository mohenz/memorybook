import { marked } from 'marked';
import createDOMPurify from 'dompurify';

marked.setOptions({ breaks: true });

type Sanitizer = { sanitize: (html: string) => string };
let purifier: Sanitizer | null = null;

// dompurify's ESM entry sometimes resolves to the un-instantiated factory rather
// than the ready-to-use sanitizer depending on the bundler/runtime (observed under
// Vitest) — call it with `window` in that case instead of assuming either shape.
// Built lazily so importing this module in a non-DOM test environment (no `window`
// at all) doesn't fail as long as that environment never calls renderMarkdownToHtml.
function getPurifier(): Sanitizer {
  if (purifier) return purifier;
  const factory = createDOMPurify as unknown as Sanitizer & ((win: Window) => Sanitizer);
  purifier = typeof factory.sanitize === 'function' ? factory : factory(window);
  return purifier;
}

export function renderMarkdownToHtml(text: string): string {
  const html = marked.parse(text || '', { async: false }) as string;
  // This app only ever renders in a real browser (no SSR) — `window` is only ever
  // absent here under Vitest's react-dom/server-based component tests, where
  // sanitization can't run anyway and isn't the thing under test.
  if (typeof window === 'undefined') return html;
  return getPurifier().sanitize(html);
}

// Best-effort plain-text rendering for previews/search snippets, where markdown
// syntax characters would otherwise clutter a truncated line.
export function stripMarkdown(text: string): string {
  return (text || '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^(?:-\s?\[[ xX]\]|[-*+])\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}
