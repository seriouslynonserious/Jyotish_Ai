import { Temporal } from '@js-temporal/polyfill';
import type { BirthData } from './astrology.models';

export function birthTimeToUtc(data: BirthData): string {
  if (!Number.isFinite(data.latitude) || Math.abs(data.latitude) > 90) {
    throw new RangeError('Invalid latitude: enter a number from -90 to 90.');
  }
  if (!Number.isFinite(data.longitude) || Math.abs(data.longitude) > 180) {
    throw new RangeError('Invalid longitude: enter a number from -180 to 180.');
  }
  let date: Temporal.PlainDate;
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) throw new Error();
    date = Temporal.PlainDate.from(data.dateOfBirth, { overflow: 'reject' });
  } catch {
    throw new RangeError('Invalid DOB: use a real date in YYYY-MM-DD format.');
  }
  let time: Temporal.PlainTime;
  try {
    if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(data.timeOfBirth)) throw new Error();
    time = Temporal.PlainTime.from(data.timeOfBirth, { overflow: 'reject' });
  } catch {
    throw new RangeError('Invalid time: use HH:mm or HH:mm:ss.');
  }
  try {
    if (!data.timezone || /^[+-]/.test(data.timezone)) throw new Error();
    new Intl.DateTimeFormat('en', { timeZone: data.timezone }).format();
  } catch {
    throw new RangeError('Invalid timezone: use an IANA name such as Asia/Kolkata.');
  }
  try {
    return date
      .toPlainDateTime(time)
      .toZonedDateTime(data.timezone, {
        // Never silently pick an instant during a DST gap or repeated hour.
        disambiguation: 'reject',
      })
      .toInstant()
      .toString();
  } catch {
    throw new RangeError(
      'Birth time is ambiguous or does not exist in this timezone due to an offset change.',
    );
  }
}
