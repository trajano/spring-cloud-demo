import NetInfo from '@react-native-community/netinfo';
import { Dispatch, MutableRefObject, useEffect, useReducer } from 'react';
import { noop } from 'lodash';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import type { AuthStore } from '../AuthStore';
import type { OAuthToken } from '../OAuthToken';
import { isTokenRefExpired } from './isTokenRefExpired';
import { updateTokenInfoRef } from './updateTokenInfoRef';

type UpdateStatesEffectProps = {
  authState: AuthState;
  lastCheckTime: number;
  nextCheckTime: number | null;
  tokenRefreshable: boolean;
  authStorage: AuthStore;
  oauthTokenRef: MutableRefObject<OAuthToken | null>;
  tokenExpiresAtRef: MutableRefObject<Date | null>;
  lastBackendFailureAttemptRef: MutableRefObject<number>;
  timeBeforeExpirationRefresh: number;
  setAuthStateAndNotify: Dispatch<{ next: AuthState; event: AuthEvent }>;
  notify: (event: AuthEvent) => void;
  forceCheck: () => void;
  refresh: () => Promise<void>;
};
export function useUpdateStatesEffect({
  authState,
  lastCheckTime,
  nextCheckTime,
  tokenRefreshable,
  authStorage,
  oauthTokenRef,
  tokenExpiresAtRef,
  lastBackendFailureAttemptRef,
  timeBeforeExpirationRefresh,
  setAuthStateAndNotify,
  forceCheck,
  notify,
  refresh,
}: UpdateStatesEffectProps) {
  useEffect(() => {
    /**
     * Sets the initial auth state after getting the current token.
     */
    async function setInitialAuthState() {
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
        setAuthStateAndNotify({
          next: AuthState.UNAUTHENTICATED,
          event: {
            authState,
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
            authState,
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
            authState,
            reason: 'expired token restored from storage on intial state',
          },
        });
      }
    }

    /**
     * This may call async functions, but the values are not used hence the results are ignored.
     */
    async function handleAuthState() {
      if (
        authState === AuthState.INITIAL ||
        authState === AuthState.UNAUTHENTICATED ||
        authState === AuthState.REFRESHING
      ) {
        // no op
        return;
      }

      if (authState === AuthState.AUTHENTICATED) {
        if (nextCheckTime === null) {
          forceCheck();
        }
        if (isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh)) {
          setAuthStateAndNotify({
            next: AuthState.NEEDS_REFRESH,
            event: {
              type: 'TokenExpiration',
              authState,
              reason: `Token has expired at ${tokenExpiresAtRef.current?.toISOString()} and needs refresh`,
            },
          });
        }
      }

      if (authState === AuthState.NEEDS_REFRESH) {
        if (tokenRefreshable) {
          await refresh();
        } else {
          setAuthStateAndNotify({
            next: AuthState.BACKEND_INACCESSIBLE,
            event: {
              type: 'TokenExpiration',
              authState,
              reason: `Token has expired at ${tokenExpiresAtRef.current?.toISOString()} but backend is not accessible`,
            },
          });
          lastBackendFailureAttemptRef.current = lastCheckTime;
        }
      }

      if (
        authState === AuthState.BACKEND_INACCESSIBLE &&
        lastBackendFailureAttemptRef.current === lastCheckTime
      ) {
        if (tokenRefreshable) {
          setAuthStateAndNotify({
            next: AuthState.NEEDS_REFRESH,
            event: {
              type: 'TokenExpiration',
              authState,
              reason: 'Needs refresh, backend now accessible',
            },
          });
        } else {
          // sometimes the Native reachability check does not fire.  This ensures it is fired at least once per check time.
          await NetInfo.refresh();
        }
      }

      if (
        authState === AuthState.BACKEND_FAILURE &&
        lastBackendFailureAttemptRef.current === lastCheckTime
      ) {
        setAuthStateAndNotify({
          next: AuthState.NEEDS_REFRESH,
          event: {
            type: 'TokenExpiration',
            authState,
            reason: 'Needs refresh from backend failure',
          },
        });
      }
    }

    async function updateStatesAfterRender() {
      await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
      await handleAuthState();
    }
    if (authState === AuthState.INITIAL) {
      setInitialAuthState();
    }
    if (authState !== AuthState.INITIAL) {
      notify({
        type: 'CheckRefresh',
        reason: 'Update in useEffect dependencies',
        authState: authState,
        lastCheckTime: new Date(lastCheckTime),
        tokenRefreshable,
        tokenExpiresAt: tokenExpiresAtRef.current,
        tokenExpired: isTokenRefExpired(
          tokenExpiresAtRef,
          timeBeforeExpirationRefresh
        ),
      });
      // console.log({
      //   lastCheckTime: new Date(lastCheckTime).toISOString(),
      //   reason: `Update in authState: ${
      //     AuthState[authState]
      //   } tokenRefreshable: ${tokenRefreshable} tokenExpiresAt: ${JSON.stringify(
      //     tokenExpiresAtRef
      //   )} (${
      //     isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh)
      //       ? 'expired'
      //       : 'not expired'
      //   })`,
      //   lastBackendFailureAttemptRef: new Date(
      //     lastBackendFailureAttemptRef.current
      //   ),
      //   now: new Date().toISOString(),
      // });
      updateStatesAfterRender();
    }
  }, [lastCheckTime, authState, tokenRefreshable]);
}
