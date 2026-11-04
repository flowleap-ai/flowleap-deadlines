const MS_PER_DAY = 86_400_000;
/** Throws `RangeError` unless `value` is a real calendar date written `YYYY-MM-DD`. */
export function parseLocalDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match === null)
        throw new RangeError(`not a date in the form YYYY-MM-DD: ${JSON.stringify(value)}`);
    const date = fromParts(Number(match[1]), Number(match[2]), Number(match[3]));
    if (date !== value)
        throw new RangeError(`no such calendar date: ${value}`);
    return date;
}
export function yearOf(date) {
    return Number(date.slice(0, 4));
}
/** 0 is Sunday and 6 is Saturday. */
export function weekday(date) {
    return toUtc(date).getUTCDay();
}
export function addDays(date, days) {
    return fromUtc(new Date(toUtc(date).getTime() + days * MS_PER_DAY));
}
/** The number of days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from, to) {
    return (toUtc(to).getTime() - toUtc(from).getTime()) / MS_PER_DAY;
}
/** Rule 131(2) EPC: computation starts on the day after the relevant event. */
export function startDay(event) {
    return addDays(event, 1);
}
/**
 * Rule 131(4) EPC: a period of months expires in the relevant later month on the day with the same
 * number as the event day, or on the last day of that month when it has no such day.
 */
export function addMonths(event, months) {
    const [year, month, day] = event.split('-').map(Number);
    const target = new Date(Date.UTC(year, month - 1 + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    return fromParts(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(day, lastDay));
}
function toUtc(date) {
    return new Date(`${date}T00:00:00Z`);
}
function fromUtc(date) {
    return date.toISOString().slice(0, 10);
}
function fromParts(year, month, day) {
    return fromUtc(new Date(Date.UTC(year, month - 1, day)));
}
