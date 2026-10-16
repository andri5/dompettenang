import { describe, expect, it } from 'vitest';
import {
  isSafeIconKey,
  isSafePlainText,
  normalizeMultiline,
  normalizeWhitespace,
  stripControlChars,
} from '../../utils/sanitize.js';

describe('sanitize (OWASP input helpers)', () => {
  it('strips null bytes and control chars', () => {
    expect(stripControlChars('ab\u0000c\u0007d')).toBe('abcd');
    expect(stripControlChars('ok\tline\n')).toBe('ok\tline\n');
  });

  it('normalizes whitespace', () => {
    expect(normalizeWhitespace('  hello   world  ')).toBe('hello world');
  });

  it('normalizes multiline notes', () => {
    expect(normalizeMultiline('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('rejects XSS / HTML vectors in plain text', () => {
    expect(isSafePlainText('Belanja bulanan')).toBe(true);
    expect(isSafePlainText('<script>alert(1)</script>')).toBe(false);
    expect(isSafePlainText('click <a href="x">')).toBe(false);
    expect(isSafePlainText('javascript:alert(1)')).toBe(false);
    expect(isSafePlainText('onload=alert(1)')).toBe(false);
  });

  it('allows safe icon keys only', () => {
    expect(isSafeIconKey('utensils')).toBe(true);
    expect(isSafeIconKey('piggy-bank')).toBe(true);
    expect(isSafeIconKey('../etc')).toBe(false);
    expect(isSafeIconKey('x<script>')).toBe(false);
  });
});
