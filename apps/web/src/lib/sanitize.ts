/**
 * OWASP-aligned client-side input helpers (mirror API sanitize rules).
 */

export function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

export function normalizeWhitespace(value: string): string {
  return stripControlChars(value).trim().replace(/\s+/g, ' ');
}

export function normalizeMultiline(value: string): string {
  return stripControlChars(value)
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const UNSAFE_TEXT =
  /[<>]|javascript:|data:text\/html|vbscript:|on\w+\s*=/i;

export function isSafePlainText(value: string): boolean {
  return !UNSAFE_TEXT.test(value);
}
