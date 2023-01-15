import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { isTokenExpired } from './isTokenExpired';

/** @testonly */
export interface TokenExpirationTimeoutEffectProps {
  authState: AuthState;
  setAuthState: Dispatch<SetStateAction<AuthState>>;
  notify: (event: AuthEvent) => void;
  maxTimeoutForRefreshCheck: number;
  tokenExpiresAt: Date;
  timeBeforeExpirationRefresh: number;
}
/** @testonly */
export interface TokenExpirationTimeoutState {
  timeout: ReturnType<typeof setTimeout> | undefined;
}
/**
 * This sets up a timeout on AUTHENTICATED state that cycles every
 * `maxTimeoutForRefreshCheck` ms or `timeBeforeExpirationRefresh` ms before the
 * token expiration time. When the timeout finishes and the token is expired it
 * will set the state to NEEDS_REFRESH.
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
    function updateStateOnTimeout() {
      if (tokenExpiresAt.getTime() === 0) {
        return;
      }
      if (!timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      if (isTokenExpired(tokenExpiresAt, timeBeforeExpirationRefresh)) {
        setAuthState(AuthState.NEEDS_REFRESH);
        notify({
          type: 'TokenExpiration',
          authState,
          reason: `Token has expires on ${tokenExpiresAt.toISOString()} is near or is expired on ${new Date().toISOString()} `,
        });
      } else {
        const ms = Math.min(
          maxTimeoutForRefreshCheck,
          tokenExpiresAt.getTime() - Date.now() - timeBeforeExpirationRefresh
        );

        timeoutRef.current = setTimeout(updateStateOnTimeout, ms);
      }
    }
    if (authState === AuthState.AUTHENTICATED) {
      notify({
        type: 'CheckRefresh',
        authState,
        reason: 'useTokenExpirationTimeoutEffect dependency update',
        tokenExpiresAt,
      });
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
    setAuthState,
    notify,
    tokenExpiresAt,
    maxTimeoutForRefreshCheck,
    timeBeforeExpirationRefresh,
  ]);
  return {
    timeout: timeoutRef.current,
  };
}
