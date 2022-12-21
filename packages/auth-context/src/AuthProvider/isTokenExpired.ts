import { isBefore, subMilliseconds } from 'date-fns';

export function isTokenExpired(
  tokenExpiresAt: Date | null | undefined,
  timeBeforeExpirationRefresh: number
): boolean {
  return (
    !tokenExpiresAt ||
    !isBefore(
      Date.now(),
      subMilliseconds(tokenExpiresAt, timeBeforeExpirationRefresh)
    )
  );
}
