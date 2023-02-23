import { differenceInSeconds, formatISO } from 'date-fns';
import noop from 'lodash/noop';
import { useEffect, useReducer } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';
import { isTokenExpired } from '../isTokenExpired';
import { timeToNextExpirationCheck } from '../timeToNextExpirationCheck';

export const useAuthenticatedStateEffect = ({
  authState,
  setAuthState,
  notify,
  signaled,
  backendReachable,
  timeBeforeExpirationRefresh,
  tokenExpiresAt,
  maxTimeoutForRefreshCheckMs,
}: InternalProviderState) => {
  const [lastCheck, updateLastCheck] = useReducer(() => Date.now(), Date.now());
  useEffect(() => {
    if (!signaled || authState !== AuthState.AUTHENTICATED) {
      return noop;
    }
    if (!backendReachable) {
      notify({
        type: 'PingFailed',
        authState,
        reason: `Backend was determined to be not reachable while authenticated`,
        backendReachable,
      });
      setAuthState(AuthState.BACKEND_INACCESSIBLE);
      return noop;
    }
    if (isTokenExpired(tokenExpiresAt, timeBeforeExpirationRefresh)) {
      notify({
        type: 'TokenExpiration',
        authState,
        reason: `Token expires at ${formatISO(
          tokenExpiresAt
        )} in ${differenceInSeconds(tokenExpiresAt, Date.now())} seconds`,
      });
      setAuthState(AuthState.NEEDS_REFRESH);
      return noop;
    }
    const timeoutID = setTimeout(
      updateLastCheck,
      timeToNextExpirationCheck(
        tokenExpiresAt,
        timeBeforeExpirationRefresh,
        maxTimeoutForRefreshCheckMs
      )
    );
    return () => clearTimeout(timeoutID);
  }, [
    authState,
    backendReachable,
    lastCheck,
    signaled,
    notify,
    setAuthState,
    timeBeforeExpirationRefresh,
    tokenExpiresAt,
    maxTimeoutForRefreshCheckMs,
  ]);
};
