import { calendars } from './calendars.ts';
import { epo2025 } from './calendars/epo-2025.ts';
import { epo2026 } from './calendars/epo-2026.ts';
import { epR71_3GrantCommunicationV1 } from './rules/ep-r71-3-grant-communication.v1.ts';
import type { Calendars, EventCode, Rule } from './types.ts';

export type * from './types.ts';
export { CalendarMissing, calendars, rollClosure } from './calendars.ts';
export { addMonths, parseLocalDate, startDay } from './date.ts';
export { parseEventCode } from './rule.ts';
export { epo2025, epo2026 };

/** Every rule version of the library. Old versions stay, so a stored deadline can be recomputed. */
export const rules: readonly Rule[] = [epR71_3GrantCommunicationV1];

/** The shipped calendars: EPO 2025 and EPO 2026. */
export const epoCalendars: Calendars = calendars([epo2025, epo2026]);

/** The rule versions that `event` triggers. An empty list means that no rule knows the event. */
export function rulesFor(event: EventCode): readonly Rule[] {
  return rules.filter((rule) => rule.trigger.includes(event));
}
