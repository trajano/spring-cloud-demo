import { Dispatch, SetStateAction, useEffect, useRef } from 'react';

import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';

/** @testonly */
export interface BackendFailureTimeoutProps {
  authState: AuthState;
  setAuthState: Dispatch<SetStateAction<AuthState>>;
  notify: (event: AuthEvent) => void;
  /** Time before rechecking backend failure. */
  backendFailureTimeout: number;
}
/** @testonly */
export interface BackendFailureTimeoutState {
  timeout: ReturnType<typeof setTimeout> | undefined;
}
/**
 * This sets up a timeout on BACKEND_FAILURE state that sets the state to
 * NEEDS_REFRESH after `backendFailureTimeout` ms.
 */
export function useBackendFailureTimeoutEffect({
  authState,
  setAuthState,
  notify,
  backendFailureTimeout,
}: BackendFailureTimeoutProps): BackendFailureTimeoutState {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (authState === AuthState.BACKEND_FAILURE) {
      notify({
        type: 'CheckRefresh',
        authState,
        reason: 'timeout for backend failure retry set',
      });
      if (!timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      timeoutRef.current = undefined;
      timeoutRef.current = setTimeout(() => {
        setAuthState(AuthState.NEEDS_REFRESH);
        notify({
          type: 'CheckRefresh',
          authState,
          reason: 'retry after backend failure',
        });
        timeoutRef.current = undefined;
      }, backendFailureTimeout);
    }
    return () => {
      if (timeoutRef.current) {
        notify({
          type: 'CheckRefresh',
          authState,
          reason: `timeout for backend failure being cleared`,
        });
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [authState, setAuthState, notify, backendFailureTimeout]);
  return { timeout: timeoutRef.current };
}
