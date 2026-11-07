import { parseLocalDate } from '../date.ts';
import type { Calendar } from '../types.ts';

/** The EPO closing days of 2027 other than Saturdays and Sundays, from OJ EPO 2026, A30. */
export const epo2027: Calendar = {
  office: 'EPO',
  year: 2027,
  source: { cite: 'OJ EPO 2026, A30', url: 'https://www.epo.org/en/legal/official-journal/2026/06/a30' },
  closedDays: (
    [
      ['2027-01-01', "New Year's Day"],
      ['2027-01-06', 'Epiphany'],
      ['2027-03-08', "International Women's Day"],
      ['2027-03-26', 'Good Friday'],
      ['2027-03-29', 'Easter Monday'],
      ['2027-04-27', "King's Day"],
      ['2027-05-05', 'Liberation Day'],
      ['2027-05-06', 'Ascension Day'],
      ['2027-05-17', 'Whit Monday'],
      ['2027-05-27', 'Corpus Christi'],
      ['2027-11-01', "All Saints' Day"],
      ['2027-12-24', 'Christmas Eve'],
      ['2027-12-27', 'Bridging day'],
      ['2027-12-28', 'Bridging day'],
      ['2027-12-29', 'Bridging day'],
      ['2027-12-30', 'Bridging day'],
      ['2027-12-31', "New Year's Eve"],
    ] as const
  ).map(([date, name]) => ({ date: parseLocalDate(date), name })),
};
