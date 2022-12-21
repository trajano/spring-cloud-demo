import { Dispatch, RefObject, SetStateAction, useEffect, useRef } from 'react';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { isTokenExpired } from './isTokenExpired';

/**
 * @testonly
 */
export type TokenExpirationTimeoutEffectProps = {
  authState: AuthState;
  setAuthState: Dispatch<SetStateAction<AuthState>>;
  maxTimeoutForRefreshCheck: number;
  tokenExpiresAt: Date | null | undefined;
  timeBeforeExpirationRefresh: number;
  notify: (event: AuthEvent) => void;
};
/**
 * @testonly
 */
export type TokenExpirationTimeoutState = {
  timeoutRef: RefObject<ReturnType<typeof setTimeout>>;
};
/**
 * This sets up a timeout on AUTHENTICATED state that cycles every `maxTimeoutForRefreshCheck` ms or
 * `timeBeforeExpirationRefresh` ms before the token expiration time.  When the timeout finishes
 * and the token is expired it will set the state to NEEDS_REFRESH.
 */
export function useTokenExpirationTimeoutEffect({
  authState,
  setAuthState,
  maxTimeoutForRefreshCheck,
  tokenExpiresAt,
  timeBeforeExpirationRefresh,
  notify,
}: TokenExpirationTimeoutEffectProps): TokenExpirationTimeoutState {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (authState === AuthState.AUTHENTICATED) {
      function updateStateOnTimeout() {
        if (__DEV__) {
          if (!tokenExpiresAt) {
            throw new Error(
              'tokenExpiresAt is not defined while state is AUTHENTICATED'
            );
          }
        }
        if (!timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (isTokenExpired(tokenExpiresAt, timeBeforeExpirationRefresh)) {
          setAuthState(AuthState.NEEDS_REFRESH);
          notify({
            type: 'TokenExpiration',
            authState,
            reason: `Token has expires on ${tokenExpiresAt?.toISOString()} is near or is expired on ${new Date().toISOString()} `,
          });
        } else {
          const ms = Math.min(
            maxTimeoutForRefreshCheck,
            tokenExpiresAt!.getTime() - Date.now() - timeBeforeExpirationRefresh
          );

          timeoutRef.current = setTimeout(updateStateOnTimeout, ms);
        }
      }
      updateStateOnTimeout();
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [
    authState,
    maxTimeoutForRefreshCheck,
    tokenExpiresAt,
    timeBeforeExpirationRefresh,
  ]);
  return { timeoutRef: timeoutRef as RefObject<ReturnType<typeof setTimeout>> };
}
