import { Dispatch, SetStateAction, useEffect } from 'react';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';

/**
 * @testonly
 */
export type NeedsRefreshEffectProps = {
  authState: AuthState;
  setAuthState: Dispatch<SetStateAction<AuthState>>;
  notify: (event: AuthEvent) => void;
  /**
   * Indicates that the token is refreshable from the device.
   */
  backendReachable: boolean;
  refreshAsync: (reason?: string) => Promise<void>;
  /**
   * called when there is a refresh error.  by default it simply logs to console.error
   * Technically should never get here since the failure states are already done in refresh()
   * @param reason exception thrown by refresh
   */
  onRefreshError: (reason: unknown) => void;
};
export function useNeedsRefreshEffect({
  authState,
  setAuthState,
  notify,
  backendReachable,
  refreshAsync,
  onRefreshError,
}: NeedsRefreshEffectProps) {
  useEffect(() => {
    notify({
      type: 'CheckRefresh',
      authState,
      reason: 'useNeedsRefreshEffect dependency update',
      backendReachable,
    });
    if (authState === AuthState.NEEDS_REFRESH) {
      if (backendReachable) {
        refreshAsync('from NeedsRefresh').catch(onRefreshError);
      } else {
        setAuthState(AuthState.BACKEND_INACCESSIBLE);
      }
    } else if (authState === AuthState.BACKEND_INACCESSIBLE) {
      if (backendReachable) {
        setAuthState(AuthState.NEEDS_REFRESH);
      }
    }
  }, [
    authState,
    setAuthState,
    notify,
    onRefreshError,
    refreshAsync,
    backendReachable,
  ]);
}
