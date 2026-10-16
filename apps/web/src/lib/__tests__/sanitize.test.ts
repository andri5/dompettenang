import { describe, expect, it } from 'vitest';
import {
  isSafePlainText,
  normalizeMultiline,
  normalizeWhitespace,
  stripControlChars,
} from '@/lib/sanitize';

describe('FE sanitize helpers', () => {
  it('strips control characters', () => {
    expect(stripControlChars('a\u0000b')).toBe('ab');
  });

  it('normalizes whitespace / multiline', () => {
    expect(normalizeWhitespace('  a   b  ')).toBe('a b');
    expect(normalizeMultiline('x\n\n\ny')).toBe('x\n\ny');
  });

  it('flags unsafe plain text', () => {
    expect(isSafePlainText('OK')).toBe(true);
    expect(isSafePlainText('<script>')).toBe(false);
    expect(isSafePlainText('javascript:void(0)')).toBe(false);
  });
});
