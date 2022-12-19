import NetInfo from '@react-native-community/netinfo';
import { Dispatch, MutableRefObject, useEffect } from 'react';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import type { AuthStore } from '../AuthStore';
import type { OAuthToken } from '../OAuthToken';
import { isTokenRefExpired } from './isTokenRefExpired';
import { updateTokenInfoRef } from './updateTokenInfoRef';

type UpdateStatesEffectProps = {
  authState: AuthState;
  lastCheckTime: number;
  tokenRefreshable: boolean;
  authStorage: AuthStore;
  oauthTokenRef: MutableRefObject<OAuthToken | null>;
  tokenExpiresAtRef: MutableRefObject<Date | null>;
  lastBackendFailureAttemptRef: MutableRefObject<number>;
  refreshingRef: MutableRefObject<boolean>;
  timeBeforeExpirationRefresh: number;
  setAuthStateAndNotify: Dispatch<{ next: AuthState; event: AuthEvent }>;
  notify: (event: AuthEvent) => void;
  refresh: () => Promise<void>;
};
export function useUpdateStatesEffect({
  authState,
  lastCheckTime,
  tokenRefreshable,
  authStorage,
  oauthTokenRef,
  tokenExpiresAtRef,
  refreshingRef,
  lastBackendFailureAttemptRef,
  timeBeforeExpirationRefresh,
  setAuthStateAndNotify,
  notify,
  refresh,
}: UpdateStatesEffectProps) {
  useEffect(() => {
    async function updateStatesAfterRender() {
      await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
      if (
        authState === AuthState.INITIAL ||
        authState === AuthState.UNAUTHENTICATED ||
        authState === AuthState.REFRESHING ||
        !!refreshingRef.current
      ) {
        // no op
      } else if (
        authState === AuthState.AUTHENTICATED &&
        !isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh)
      ) {
        // no op
      } else if (
        authState === AuthState.NEEDS_REFRESH &&
        tokenRefreshable &&
        refreshingRef.current
      ) {
        // no op
      } else if (
        authState === AuthState.BACKEND_FAILURE &&
        lastBackendFailureAttemptRef.current === lastCheckTime
      ) {
        // no op
      } else if (
        authState === AuthState.NEEDS_REFRESH &&
        lastBackendFailureAttemptRef.current === lastCheckTime
      ) {
        // no op
      } else if (
        authState === AuthState.BACKEND_INACCESSIBLE &&
        !tokenRefreshable
      ) {
        // sometimes the Native reachability check does not fire.  This ensures it is fired at least once per check time.
        await NetInfo.refresh();
      } else if (
        authState === AuthState.BACKEND_INACCESSIBLE &&
        lastBackendFailureAttemptRef.current === lastCheckTime
      ) {
        // no op
      } else if (
        authState === AuthState.BACKEND_INACCESSIBLE &&
        tokenRefreshable
      ) {
        // clear off attempt
        lastBackendFailureAttemptRef.current = 0;
        setAuthStateAndNotify({
          next: AuthState.NEEDS_REFRESH,
          event: {
            type: 'TokenExpiration',
            authState,
            reason: 'Needs refresh, backend was inaccessible is now accessible',
          },
        });
      } else if (
        authState === AuthState.BACKEND_FAILURE &&
        lastBackendFailureAttemptRef.current !== lastCheckTime &&
        !refreshingRef.current
      ) {
        setAuthStateAndNotify({
          next: AuthState.NEEDS_REFRESH,
          event: {
            type: 'TokenExpiration',
            authState,
            reason: 'Needs refresh from backend failure',
          },
        });
      } else if (
        authState === AuthState.NEEDS_REFRESH &&
        tokenRefreshable &&
        !refreshingRef.current
      ) {
        notify({
          type: 'CheckRefresh',
          authState,
          reason: 'Needs refresh and token is refreshable and not refreshing',
        });
        await refresh();
      } else if (authState === AuthState.NEEDS_REFRESH && !tokenRefreshable) {
        // use zero because there's still that grace time
        setAuthStateAndNotify({
          next: AuthState.BACKEND_INACCESSIBLE,
          event: {
            type: 'TokenExpiration',
            authState,
            reason: `Token has expired at ${tokenExpiresAtRef.current?.toISOString()} but backend is not accessible`,
          },
        });
        lastBackendFailureAttemptRef.current = lastCheckTime;
      } else if (
        authState === AuthState.AUTHENTICATED &&
        isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh)
      ) {
        setAuthStateAndNotify({
          next: AuthState.NEEDS_REFRESH,
          event: {
            type: 'TokenExpiration',
            authState,
            reason: `Token has expired at ${tokenExpiresAtRef.current?.toISOString()} and needs refresh`,
          },
        });
      } else {
        /* istanbul ignore next */
        console.warn(
          `Unexpected state = ${JSON.stringify({
            lastCheckTime: new Date(lastCheckTime).toISOString(),
            authState: AuthState[authState],
            tokenRefreshable,
            oauthTokenRef,
            tokenExpiresAtRef,
          })}`
        );
      }
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
      //   reason: `Update in authState: ${AuthState[authState]} tokenRefreshable: ${tokenRefreshable} tokenExpiresAt: ${JSON.stringify(tokenExpiresAtRef)} (${isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh) ? "expired" : "not expired"})`,
      //   lastBackendFailureAttemptRef: new Date(lastBackendFailureAttemptRef.current),
      //   now: new Date().toISOString()
      // })
      updateStatesAfterRender();
    }
  }, [lastCheckTime, authState, tokenRefreshable]);
}
