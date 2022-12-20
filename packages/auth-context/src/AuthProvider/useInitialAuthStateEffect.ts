import { Dispatch, MutableRefObject, useEffect } from 'react';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import type { AuthStore } from '../AuthStore';
import type { OAuthToken } from '../OAuthToken';
import { updateTokenInfoRef } from './updateTokenInfoRef';

import { isTokenRefExpired } from './isTokenRefExpired';

type InitialAuthStateEffectProps = {
  authStateRef: MutableRefObject<AuthState>;
  setAuthStateAndNotify: Dispatch<{ next: AuthState; event: AuthEvent }>;
  authStorage: AuthStore;
  oauthTokenRef: MutableRefObject<OAuthToken | null>;
  tokenExpiresAtRef: MutableRefObject<Date | null>;
  timeBeforeExpirationRefresh: number;
};
export function useInitialAuthStateEffect({
  authStateRef,
  setAuthStateAndNotify,
  authStorage,
  oauthTokenRef,
  tokenExpiresAtRef,
  timeBeforeExpirationRefresh,
}: InitialAuthStateEffectProps) {
  useEffect(() => {

    /**
     * Sets the initial auth state after getting the current token.
     */
    async function setInitialAuthState() {
      if (__DEV__) {
        if (authStateRef.current !== AuthState.INITIAL) {
          console.error(
            `Expected INITIAL auth state on render, but was ${
              AuthState[authStateRef.current]
            }`
          );
          throw Error(
            `Expected INITIAL auth state on render, but was ${
              AuthState[authStateRef.current]
            }`
          );
        }
      }
      await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
      if (!oauthTokenRef.current || !tokenExpiresAtRef.current) {
        // no token so unauthenticated
        setAuthStateAndNotify({
          next: AuthState.UNAUTHENTICATED,
          event: {
            authState: AuthState.INITIAL,
            type: 'Unauthenticated',
            reason: 'no token or expiration information on initial state',
          },
        });
      } else if (
        !isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh)
      ) {
        // token present and not expired yet, so authenticated
        setAuthStateAndNotify({
          next: AuthState.AUTHENTICATED,
          event: {
            type: 'Authenticated',
            authState: AuthState.INITIAL,
            reason: 'active token restored from storage on intial state',
            accessToken: oauthTokenRef.current.access_token,
            authorization: `Bearer ${oauthTokenRef.current.access_token}`,
            tokenExpiresAt: tokenExpiresAtRef.current,
          },
        });
      } else {
        // token has expired so needs refresh
        setAuthStateAndNotify({
          next: AuthState.NEEDS_REFRESH,
          event: {
            type: 'TokenExpiration',
            authState: AuthState.INITIAL,
            reason: 'expired token restored from storage on intial state',
          },
        });
      }
    }
    setInitialAuthState();
  }, []);
}
