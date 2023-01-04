import { Dispatch, SetStateAction, useEffect } from 'react';
import { AppState } from 'react-native';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
/**
 * @testonly
 */
export type PreventAppFromGettingStuckOnRefreshProps = {
  authState: AuthState;
  setAuthState: Dispatch<SetStateAction<AuthState>>;
  notify: (event: AuthEvent) => void;
  /**
   * Indicates that the token is refreshable from the device.
   */
  backendReachable: boolean;
  tokenExpiresAt: Date;
};

export function usePreventAppFromGettingStuckOnRefreshEffect({
  authState,
  setAuthState,
  notify,
  backendReachable,
  tokenExpiresAt,
}: PreventAppFromGettingStuckOnRefreshProps): void {
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        if (nextAppState === 'active' && authState === AuthState.REFRESHING) {
          setAuthState(AuthState.NEEDS_REFRESH);
          notify({
            type: 'CheckRefresh',
            authState,
            reason:
              'AuthState === REFRESHING but state just switched to Active, forcing recheck',
            backendReachable,
            tokenExpiresAt,
          });
        }
      }
    );
    return () => appStateSubscription.remove();
  }, [authState, setAuthState, notify, backendReachable, tokenExpiresAt]);
}
