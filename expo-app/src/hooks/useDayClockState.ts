import { useClockState } from "@trajano/react-hooks";
import { addDays, differenceInMilliseconds, startOfDay } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import * as Localization from "expo-localization";

/**
 * @param now Now in UTC
 * @param timeZone Time zone
 * @testonly
 */
export function millisecondsBeforeNextDay(
  now: number | Date,
  timeZone: string
): number {
  const nowAtZone = utcToZonedTime(now, timeZone);
  const diff = differenceInMilliseconds(
    addDays(startOfDay(nowAtZone), 1),
    nowAtZone
  );
  return diff === 86400000 ? 0 : diff;
}
/**
 * This extends the useClockState but is specific for a given day based on the
 * local timezone
 */
export function useDayClockState(): Date {
  const defaultCalendar = Localization.getCalendars()[0];
  const now = useClockState(
    24 * 60 * 60 * 1000,
    millisecondsBeforeNextDay(Date.now(), defaultCalendar.timeZone!)
  );
  return now;
}
