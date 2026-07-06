import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "b",
  "i",
  "em",
  "strong",
  "a",
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class"];

/** Strip dangerous HTML before rendering with dangerouslySetInnerHTML. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
