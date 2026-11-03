import type { Calendar, Calendars, LocalDate, OfficeCode, TraceStep } from './types.ts';
export declare class CalendarMissing extends Error {
    readonly office: OfficeCode;
    readonly year: number;
    constructor(office: OfficeCode, year: number);
}
/** Throws when two calendars cover the same office and year, or a closed day is outside its year. */
export declare function calendars(list: readonly Calendar[]): Calendars;
/**
 * Rule 134(1) EPC: a period that expires on a day on which a filing office is closed extends to the
 * next day on which all filing offices are open. Saturdays and Sundays are closed days. Throws
 * `CalendarMissing` when a year on the way has no calendar.
 */
export declare function rollClosure(office: OfficeCode, date: LocalDate, calendars: Calendars): LocalDate;
/** The trace step of `rollClosure`; it cites each calendar that the roll read. */
export declare function closureRollStep(office: OfficeCode, from: LocalDate, calendars: Calendars): TraceStep;
