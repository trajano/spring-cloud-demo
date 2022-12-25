import { Dispatch, RefObject, SetStateAction, useEffect, useRef } from 'react';

import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';

/**
 * @testonly
 */
export type BackendFailureTimeoutProps = {
  authState: AuthState;
  setAuthState: Dispatch<SetStateAction<AuthState>>;
  notify: (event: AuthEvent) => void;
  /**
   * Time before rechecking backend failure.
   */
  backendFailureTimeout: number;
};
/**
 * @testonly
 */
export type BackendFailureTimeoutState = {
  timeoutRef: RefObject<ReturnType<typeof setTimeout>>;
};
/**
 * This sets up a timeout on BACKEND_FAILURE state that sets the state to NEEDS_REFRESH after
 * `backendFailureTimeout` ms.
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
      if (!timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
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
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [authState, backendFailureTimeout]);
  return { timeoutRef: timeoutRef as RefObject<ReturnType<typeof setTimeout>> };
}
