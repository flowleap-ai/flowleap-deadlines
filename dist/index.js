import { calendars } from './calendars.js';
import { epo2025 } from './calendars/epo-2025.js';
import { epo2026 } from './calendars/epo-2026.js';
import { epo2027 } from './calendars/epo-2027.js';
import { epA94_3ExaminationCommunicationV1 } from './rules/ep-a94-3-examination-communication.v1.js';
import { epR71_3GrantCommunicationV1 } from './rules/ep-r71-3-grant-communication.v1.js';
export { CalendarMissing, calendars, rollClosure } from './calendars.js';
export { addMonths, parseLocalDate, startDay } from './date.js';
export { parseEventCode } from './rule.js';
export { epo2025, epo2026, epo2027 };
/** Every rule version of the library. Old versions stay, so a stored deadline can be recomputed. */
export const rules = [epR71_3GrantCommunicationV1, epA94_3ExaminationCommunicationV1];
/** The shipped calendars: EPO 2025, EPO 2026 and EPO 2027. */
export const epoCalendars = calendars([epo2025, epo2026, epo2027]);
/** The rule versions that `event` triggers. An empty list means that no rule knows the event. */
export function rulesFor(event) {
    return rules.filter((rule) => rule.trigger.includes(event));
}
