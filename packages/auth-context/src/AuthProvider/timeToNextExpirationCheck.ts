import { differenceInMilliseconds, subMilliseconds } from 'date-fns';

/**
 * Milliseconds till the token needs to be checked for expiration again. This is
 * capped by `maxTimeoutForRefreshCheck`.
 *
 * @param tokenExpiresAt When does the token actual expire
 * @param timeBeforeExpirationRefreshMs The amount of ms to subtract from the
 *   expiration time so it can be refreshed sooner.
 * @param maxTimeoutForRefreshCheckMs Maximum number of ms before the check is
 *   fired again. Should not be larger than 60 seconds.
 * @returns Time before expiration. This will never be negative, but may be
 *   zero.
 */
export const timeToNextExpirationCheck = (
  tokenExpiresAt: Date,
  timeBeforeExpirationRefreshMs: number,
  maxTimeoutForRefreshCheckMs: number
) =>
  Math.max(
    0,
    Math.min(
      differenceInMilliseconds(
        subMilliseconds(tokenExpiresAt, timeBeforeExpirationRefreshMs),
        Date.now()
      ),
      maxTimeoutForRefreshCheckMs
    )
  );
