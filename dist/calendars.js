import { addDays, weekday, yearOf } from './date.js';
export class CalendarMissing extends Error {
    office;
    year;
    constructor(office, year) {
        super(`no ${office} calendar of closing days for ${year} is loaded`);
        this.name = 'CalendarMissing';
        this.office = office;
        this.year = year;
    }
}
/** Throws when two calendars cover the same office and year, or a closed day is outside its year. */
export function calendars(list) {
    const byKey = new Map();
    for (const calendar of list) {
        const key = `${calendar.office}:${calendar.year}`;
        if (byKey.has(key))
            throw new Error(`two calendars for ${key}`);
        const stray = calendar.closedDays.find((day) => yearOf(day.date) !== calendar.year);
        if (stray !== undefined)
            throw new Error(`calendar ${key} lists ${stray.date}, a day of another year`);
        byKey.set(key, calendar);
    }
    return {
        calendar(office, year) {
            const calendar = byKey.get(`${office}:${year}`);
            if (calendar === undefined)
                throw new CalendarMissing(office, year);
            return calendar;
        },
    };
}
/**
 * Rule 134(1) EPC: a period that expires on a day on which a filing office is closed extends to the
 * next day on which all filing offices are open. Saturdays and Sundays are closed days. Throws
 * `CalendarMissing` when a year on the way has no calendar.
 */
export function rollClosure(office, date, calendars) {
    let day = date;
    while (isClosed(office, day, calendars))
        day = addDays(day, 1);
    return day;
}
/** The trace step of `rollClosure`; it cites each calendar that the roll read. */
export function closureRollStep(office, from, calendars) {
    const to = rollClosure(office, from, calendars);
    const sources = [];
    for (let year = yearOf(from); year <= yearOf(to); year++)
        sources.push(calendars.calendar(office, year).source.cite);
    return { op: 'closure-roll', from, to, cite: ['Rule 134(1) EPC', ...sources].join('; ') };
}
function isClosed(office, date, calendars) {
    const { closedDays } = calendars.calendar(office, yearOf(date));
    const day = weekday(date);
    return day === 0 || day === 6 || closedDays.some((closed) => closed.date === date);
}
