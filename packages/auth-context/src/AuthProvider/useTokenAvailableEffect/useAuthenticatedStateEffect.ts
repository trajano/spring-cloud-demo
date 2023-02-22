import { formatISO } from 'date-fns';
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
  backendReachable,
  timeBeforeExpirationRefresh,
  tokenExpiresAt,
  maxTimeoutForRefreshCheckMs,
}: InternalProviderState) => {
  const [lastCheck, updateLastCheck] = useReducer(() => Date.now(), Date.now());
  useEffect(() => {
    if (authState !== AuthState.AUTHENTICATED) {
      return noop;
    }
    if (!backendReachable) {
      setAuthState(AuthState.BACKEND_INACCESSIBLE);
      return noop;
    }
    if (isTokenExpired(tokenExpiresAt, timeBeforeExpirationRefresh)) {
      notify({
        type: 'TokenExpiration',
        authState,
        reason: `Token expires at ${formatISO(tokenExpiresAt)}`,
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
    notify,
    setAuthState,
    timeBeforeExpirationRefresh,
    tokenExpiresAt,
    maxTimeoutForRefreshCheckMs
  ]);
};
