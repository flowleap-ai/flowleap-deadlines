import { parseLocalDate } from '../date.js';
/** The EPO closing days of 2025 other than Saturdays and Sundays, from OJ EPO 2024, A91. */
export const epo2025 = {
    office: 'EPO',
    year: 2025,
    source: { cite: 'OJ EPO 2024, A91', url: 'https://www.epo.org/en/legal/official-journal/2024/10/a91' },
    closedDays: [
        ['2025-01-01', "New Year's Day"],
        ['2025-01-06', 'Epiphany'],
        ['2025-04-18', 'Good Friday'],
        ['2025-04-21', 'Easter Monday'],
        ['2025-05-01', 'Labour Day'],
        ['2025-05-05', 'Liberation Day'],
        ['2025-05-29', 'Ascension Day'],
        ['2025-06-09', 'Whit Monday'],
        ['2025-06-19', 'Corpus Christi'],
        ['2025-08-15', 'Assumption Day'],
        ['2025-10-03', 'Day of German Unity'],
        ['2025-12-24', 'Christmas Eve'],
        ['2025-12-25', 'Christmas Day'],
        ['2025-12-26', 'Boxing Day'],
        ['2025-12-29', 'Bridging day'],
        ['2025-12-30', 'Bridging day'],
        ['2025-12-31', "New Year's Eve"],
    ].map(([date, name]) => ({ date: parseLocalDate(date), name })),
};
