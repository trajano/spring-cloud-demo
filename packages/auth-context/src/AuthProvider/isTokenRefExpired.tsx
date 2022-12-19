import { isBefore, subMilliseconds } from "date-fns";
import type { RefObject } from "react";

export function isTokenRefExpired(tokenExpiresAtRef: RefObject<Date | null>, timeBeforeExpirationRefresh: number): boolean {
  return !tokenExpiresAtRef.current || !isBefore(Date.now(), subMilliseconds(tokenExpiresAtRef.current, timeBeforeExpirationRefresh));
}
