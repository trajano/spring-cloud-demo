import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
} from 'react';
import type { AuthStore } from '../AuthStore';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import type { OAuthToken } from '../OAuthToken';
import { isTokenRefExpired } from './isTokenRefExpired';

/**
 * @testonly
 */
export type InitialAuthStateProps = {
  authState: AuthState;
  setAuthState: Dispatch<SetStateAction<AuthState>>;
  notify: (event: AuthEvent) => void;
  authStorage: AuthStore;
  oauthTokenRef: MutableRefObject<OAuthToken | null>;
  tokenExpiresAtRef: MutableRefObject<Date | null>;
  updateTokenInfoRef: (
    authStorage: AuthStore,
    oauthTokenRef: MutableRefObject<OAuthToken | null>,
    tokenExpiresAtRef: MutableRefObject<Date | null>
  ) => Promise<void>;
  timeBeforeExpirationRefresh: number;
};
export function useInitialAuthStateEffect({
  authState,
  setAuthState,
  notify,
  authStorage,
  oauthTokenRef,
  tokenExpiresAtRef,
  timeBeforeExpirationRefresh,
  updateTokenInfoRef,
}: InitialAuthStateProps) {
  const setInitialAuthState = useCallback(async () => {
    if (__DEV__) {
      if (authState !== AuthState.INITIAL) {
        throw Error(
          `Expected INITIAL auth state on render, but was ${AuthState[authState]}`
        );
      }
    }
    await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
    if (!oauthTokenRef.current || !tokenExpiresAtRef.current) {
      // no token so unauthenticated
      setAuthState(AuthState.UNAUTHENTICATED);
      notify({
        authState,
        type: 'Unauthenticated',
        reason: 'no token or expiration information on initial state',
      });
    } else if (
      !isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh)
    ) {
      // token present and not expired yet, so authenticated
      setAuthState(AuthState.AUTHENTICATED);
      notify({
        type: 'Authenticated',
        authState,
        reason: 'active token restored from storage on intial state',
        accessToken: oauthTokenRef.current.access_token,
        authorization: `Bearer ${oauthTokenRef.current.access_token}`,
        tokenExpiresAt: tokenExpiresAtRef.current,
      });
    } else {
      // token has expired so needs refresh
      setAuthState(AuthState.NEEDS_REFRESH);
      notify({
        type: 'TokenExpiration',
        authState,
        reason: 'expired token restored from storage on intial state',
      });
    }
  }, []);
  useEffect(() => {
    if (authState === AuthState.INITIAL) {
      setInitialAuthState();
    }
  }, [authState]);
}
