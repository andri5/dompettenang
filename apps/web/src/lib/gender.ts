/**
 * Shared gender helpers
 */

export type Gender = 'MALE' | 'FEMALE';

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Laki-laki' },
  { value: 'FEMALE', label: 'Perempuan' },
];

export function genderLabel(gender?: Gender | string | null): string | null {
  if (!gender) return null;
  return GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? null;
}
