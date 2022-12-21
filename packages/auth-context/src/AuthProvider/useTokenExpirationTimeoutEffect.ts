import {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  // will likely remove in the future, but keeping it here for debugging
  lastCheckAt: Date;
  // will likely remove in the future, but keeping it here for debugging
  nextCheckAt: Date | null;
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
  const [lastCheckAt, setLastCheckAt] = useState(new Date());
  const [nextCheckAt, setNextCheckAt] = useState<Date | null>(null);
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
          timeoutRef.current = undefined;
        }
        setNextCheckAt(null);
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
          setNextCheckAt(new Date(Date.now() + ms));
        }
      }
      notify({
        type: 'CheckRefresh',
        authState,
        reason: 'useTokenExpirationTimeoutEffect dependency update',
        tokenExpiresAt,
      });
      setLastCheckAt(new Date());
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
    tokenExpiresAt,
    maxTimeoutForRefreshCheck,
    timeBeforeExpirationRefresh,
  ]);
  return {
    lastCheckAt,
    nextCheckAt,
    timeoutRef: timeoutRef as RefObject<ReturnType<typeof setTimeout>>,
  };
}
