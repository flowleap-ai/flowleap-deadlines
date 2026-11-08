import { epo2025 } from './calendars/epo-2025.ts';
import { epo2026 } from './calendars/epo-2026.ts';
import { epo2027 } from './calendars/epo-2027.ts';
import type { Calendars, EventCode, Rule } from './types.ts';
export type * from './types.ts';
export { CalendarMissing, calendars, rollClosure } from './calendars.ts';
export { addMonths, parseLocalDate, startDay } from './date.ts';
export { parseEventCode } from './rule.ts';
export { epo2025, epo2026, epo2027 };
/** Every rule version of the library. Old versions stay, so a stored deadline can be recomputed. */
export declare const rules: readonly Rule[];
/** The shipped calendars: EPO 2025, EPO 2026 and EPO 2027. */
export declare const epoCalendars: Calendars;
/** The rule versions that `event` triggers. An empty list means that no rule knows the event. */
export declare function rulesFor(event: EventCode): readonly Rule[];
