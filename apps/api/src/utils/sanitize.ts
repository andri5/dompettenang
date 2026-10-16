/**
 * OWASP-aligned input helpers (Input Validation Cheat Sheet).
 * Canonicalize → length/type check → reject dangerous content.
 */

/** Strip null bytes and C0/C1 controls except tab/LF/CR. */
export function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

export function normalizeWhitespace(value: string): string {
  return stripControlChars(value).trim().replace(/\s+/g, ' ');
}

/** Free-text notes: keep newlines, collapse spaces, strip controls. */
export function normalizeMultiline(value: string): string {
  return stripControlChars(value)
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Reject stored XSS / HTML injection vectors in user text. */
const UNSAFE_TEXT =
  /[<>]|javascript:|data:text\/html|vbscript:|on\w+\s*=/i;

export function isSafePlainText(value: string): boolean {
  return !UNSAFE_TEXT.test(value);
}

export function isSafeIconKey(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value) && value.length <= 32;
}
