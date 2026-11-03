import type { LocalDate } from './types.ts';
/** Throws `RangeError` unless `value` is a real calendar date written `YYYY-MM-DD`. */
export declare function parseLocalDate(value: string): LocalDate;
export declare function yearOf(date: LocalDate): number;
/** 0 is Sunday and 6 is Saturday. */
export declare function weekday(date: LocalDate): number;
export declare function addDays(date: LocalDate, days: number): LocalDate;
/** The number of days from `from` to `to`; negative when `to` is earlier. */
export declare function daysBetween(from: LocalDate, to: LocalDate): number;
/** Rule 131(2) EPC: computation starts on the day after the relevant event. */
export declare function startDay(event: LocalDate): LocalDate;
/**
 * Rule 131(4) EPC: a period of months expires in the relevant later month on the day with the same
 * number as the event day, or on the last day of that month when it has no such day.
 */
export declare function addMonths(event: LocalDate, months: number): LocalDate;
