import { Dispatch, SetStateAction, useCallback, useEffect } from 'react';

import { isTokenExpired } from './isTokenExpired';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import type { IAuthStore } from '../AuthStore';
import type { OAuthToken } from '../OAuthToken';

/** @testonly */
export interface InitialAuthStateProps {
  authState: AuthState;
  setAuthState: Dispatch<SetStateAction<AuthState>>;
  notify: (event: AuthEvent) => void;
  authStorage: IAuthStore;
  timeBeforeExpirationRefresh: number;
  setOAuthToken: Dispatch<OAuthToken | null>;
  setTokenExpiresAt: Dispatch<Date | number>;
}
export function useInitialAuthStateEffect({
  authState,
  setAuthState,
  notify,
  timeBeforeExpirationRefresh,
  authStorage,
  setOAuthToken,
  setTokenExpiresAt,
}: InitialAuthStateProps) {
  const setInitialAuthStateAsync = useCallback(async () => {
    /* istanbul ignore next */
    if (__DEV__) {
      if (authState !== AuthState.INITIAL) {
        throw Error(
          `Expected INITIAL auth state on render, but was ${AuthState[authState]}`
        );
      }
    }
    const nextOAuthToken = await authStorage.getOAuthTokenAsync();
    const nextTokenExpiresAt = await authStorage.getTokenExpiresAtAsync();

    if (!nextOAuthToken || nextTokenExpiresAt.getTime() === 0) {
      // no token so unauthenticated
      setAuthState(AuthState.UNAUTHENTICATED);
      notify({
        authState,
        type: 'Unauthenticated',
        reason: 'no token or expiration information on initial state',
      });
      return;
    }

    setOAuthToken(nextOAuthToken);
    setTokenExpiresAt(nextTokenExpiresAt);

    // regardless whether token present and not expired yet, refresh is needed
    // but the event will have different reasons.
    setAuthState(AuthState.NEEDS_REFRESH);

    if (!isTokenExpired(nextTokenExpiresAt, timeBeforeExpirationRefresh)) {
      notify({
        type: 'TokenExpiration',
        authState,
        reason: 'active token restored from storage on initial state',
      });
    } else {
      notify({
        type: 'TokenExpiration',
        authState,
        reason: 'expired token restored from storage on initial state',
      });
    }
  }, [
    authState,
    authStorage,
    notify,
    setAuthState,
    setOAuthToken,
    setTokenExpiresAt,
    timeBeforeExpirationRefresh,
  ]);
  useEffect(() => {
    if (authState === AuthState.INITIAL) {
      setInitialAuthStateAsync().catch(console.error);
    }
  }, [authState, setInitialAuthStateAsync]);
}
