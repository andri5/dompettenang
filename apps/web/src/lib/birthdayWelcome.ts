/**
 * Once-per-year birthday popup when the user logs in on their birth day.
 */

const SEEN_PREFIX = 'dt-birthday-seen:';

export const BIRTHDAY_POPUP = {
  title: 'Selamat ulang tahun!',
  message:
    'Semoga tahun ini lebih tenang dan keuanganmu semakin rapi. Dompet Tenang siap menemani setiap catatanmu.',
  confirmLabel: 'Terima kasih',
} as const;

function seenKey(userId: string, year: number): string {
  return `${SEEN_PREFIX}${userId}:${year}`;
}

/** Parse YYYY-MM-DD (or ISO) as calendar month/day without UTC shift. */
export function parseBirthMonthDay(
  birthDate: string
): { month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate.trim());
  if (match) {
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day };
    }
    return null;
  }
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return { month: parsed.getMonth() + 1, day: parsed.getDate() };
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** True when local calendar month/day matches birthDate (Feb 29 → Feb 28 on non-leap years). */
export function isBirthdayToday(
  birthDate: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!birthDate) return false;
  const parts = parseBirthMonthDay(birthDate);
  if (!parts) return false;

  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  let { month, day } = parts;

  if (month === 2 && day === 29 && !isLeapYear(now.getFullYear())) {
    day = 28;
  }

  return todayMonth === month && todayDay === day;
}

export function hasSeenBirthday(
  userId?: string | null,
  year: number = new Date().getFullYear()
): boolean {
  if (!userId) return false;
  try {
    return localStorage.getItem(seenKey(userId, year)) === '1';
  } catch {
    return false;
  }
}

export function markBirthdaySeen(
  userId?: string | null,
  year: number = new Date().getFullYear()
): void {
  if (!userId) return;
  try {
    localStorage.setItem(seenKey(userId, year), '1');
  } catch {
    /* ignore */
  }
}

export function shouldOfferBirthday(
  user: {
    id?: string;
    birthDate?: string | null;
  } | null | undefined,
  now: Date = new Date()
): boolean {
  if (!user?.id) return false;
  if (!isBirthdayToday(user.birthDate, now)) return false;
  return !hasSeenBirthday(user.id, now.getFullYear());
}
