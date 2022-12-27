import { parseISO } from "date-fns";
import { zonedTimeToUtc } from "date-fns-tz";

import { millisecondsBeforeNextDay } from "./useDayClockState";

it("23:59:00.000 should be 60000", () => {
  const specimen = zonedTimeToUtc(
    parseISO("2022-01-01T23:59:00.000"),
    "America/Toronto"
  );
  expect(millisecondsBeforeNextDay(specimen, "America/Toronto")).toBe(60000);
});

it("00:00:00.000 should be 0", () => {
  const specimen = zonedTimeToUtc(
    parseISO("2022-01-01T00:00:00.000"),
    "America/Toronto"
  );
  expect(millisecondsBeforeNextDay(specimen, "America/Toronto")).toBe(0);
});
