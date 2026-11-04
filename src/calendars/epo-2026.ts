import { parseLocalDate } from '../date.ts';
import type { Calendar } from '../types.ts';

/** The EPO closing days of 2026 other than Saturdays and Sundays, from OJ EPO 2025, A40. */
export const epo2026: Calendar = {
  office: 'EPO',
  year: 2026,
  source: { cite: 'OJ EPO 2025, A40', url: 'https://www.epo.org/en/legal/official-journal/2025/06/a40' },
  closedDays: (
    [
      ['2026-01-01', "New Year's Day"],
      ['2026-01-06', 'Epiphany'],
      ['2026-04-03', 'Good Friday'],
      ['2026-04-06', 'Easter Monday'],
      ['2026-04-27', "King's Day"],
      ['2026-05-01', 'Labour Day'],
      ['2026-05-05', 'Liberation Day'],
      ['2026-05-14', 'Ascension Day'],
      ['2026-05-25', 'Whit Monday'],
      ['2026-06-04', 'Corpus Christi'],
      ['2026-12-24', 'Christmas Eve'],
      ['2026-12-25', 'Christmas Day'],
      ['2026-12-28', 'Bridging day'],
      ['2026-12-29', 'Bridging day'],
      ['2026-12-30', 'Bridging day'],
      ['2026-12-31', "New Year's Eve"],
    ] as const
  ).map(([date, name]) => ({ date: parseLocalDate(date), name })),
};
