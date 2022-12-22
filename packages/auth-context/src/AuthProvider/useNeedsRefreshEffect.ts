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
  tokenRefreshable: boolean;
  refreshAsync: () => Promise<void>;
  /**
   * called when there is a refresh error.  by default it simply logs to console.error
   * Technically should never get here since the failure states are already done in refresh()
   * @param reason exception thrown by refresh
   */
  onRefreshError?: (reason: unknown) => void;
};
export function useNeedsRefreshEffect({
  authState,
  setAuthState,
  notify,
  tokenRefreshable,
  refreshAsync,
  onRefreshError = (reason) => console.error(reason),
}: NeedsRefreshEffectProps) {
  useEffect(() => {
    notify({
      type: 'CheckRefresh',
      authState,
      reason: 'useNeedsRefreshEffect dependency update',
      tokenRefreshable,
    });
    if (authState === AuthState.NEEDS_REFRESH) {
      if (tokenRefreshable) {
        setAuthState(AuthState.REFRESHING);
        refreshAsync().catch(onRefreshError);
      } else {
        setAuthState(AuthState.BACKEND_INACCESSIBLE);
      }
    } else if (authState === AuthState.BACKEND_INACCESSIBLE) {
      if (tokenRefreshable) {
        setAuthState(AuthState.NEEDS_REFRESH);
      }
    }
  }, [authState, tokenRefreshable]);
}
