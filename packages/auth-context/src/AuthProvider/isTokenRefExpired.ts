import type { RefObject } from 'react';
import { isTokenExpired } from './isTokenExpired';

export function isTokenRefExpired(
  tokenExpiresAtRef: RefObject<Date | null>,
  timeBeforeExpirationRefresh: number
): boolean {
  return (
    !tokenExpiresAtRef.current ||
    isTokenExpired(tokenExpiresAtRef.current, timeBeforeExpirationRefresh)
  );
}
