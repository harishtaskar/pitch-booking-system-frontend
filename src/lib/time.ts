/** The browser's IANA timezone, sent to the backend so expiry is consistent. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/** Today's date as YYYY-MM-DD in the browser's local time. */
export function todayLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

/** Add `days` to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

/** Format a 24h "HH:MM" wall-clock time as 12-hour with AM/PM, e.g. "1:00 PM". */
export function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

/** Format a "YYYY-MM-DD" date as a readable label, e.g. "Mon, Jun 1, 2026". */
export function formatDateLong(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Client-side safeguard: has the slot at `startTime` (HH:MM) on `date`
 * (YYYY-MM-DD) already started, in the browser's local time? `new Date("...T...")`
 * without a Z suffix parses as local time, matching the backend's tz logic.
 */
export function isSlotExpired(date: string, startTime: string): boolean {
  const start = new Date(`${date}T${startTime}:00`);
  return start.getTime() <= Date.now();
}
