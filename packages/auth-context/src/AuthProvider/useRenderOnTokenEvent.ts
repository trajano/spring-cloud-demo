import type { NetInfoState } from '@react-native-community/netinfo';
import { Dispatch, useMemo } from 'react';
import type { AuthEvent } from '../AuthEvent';
import type { AuthState } from '../AuthState';
import type { EndpointConfiguration } from '../EndpointConfiguration';
import type { OAuthToken } from '../OAuthToken';
import { useNetInfoState } from '../useNetInfoState';
import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';

/**
 * @testonly
 */
export type RenderOnTokenEventProps = {
  authState: AuthState;
  setAuthState: Dispatch<AuthState>;
  notify: (event: AuthEvent) => void;
  oauthToken: OAuthToken | null;
  tokenExpiresAt: Date | null;
  timeBeforeExpirationRefresh: number;
  endpointConfiguration: EndpointConfiguration;
};
/**
 * @testonly
 */
export type RenderOnTokenEventState = {
  /**
   * Token is refreshable
   */
  backendReachable: boolean;
  /**
   * Net info state.
   */
  netInfoState: NetInfoState;
};
/**
 * A hook that will rerender a component using this hook when:
 * - app state changes,
 * - network state changes
 * - token needs to be rechecked.
 * - if the connectivty changes to true and it's in REFRESHING state, then it will switch to either AUTHENTICATED or NEEDS_REFRESH accordingly.
 * @param endpointConfiguration to obtain the ping URL
 */
export function useRenderOnTokenEvent({
  endpointConfiguration,
}: RenderOnTokenEventProps): RenderOnTokenEventState {
  /**
   * App State
   */
  const appState = useAppStateWithNetInfoRefresh();
  /**
   * Net info state.
   */
  const netInfoState = useNetInfoState(endpointConfiguration);

  /**
   * Backend is reachable if the app is active, there's a connection and the internet is reachable via
   * connection to the backend.
   */
  const backendReachable = useMemo<boolean>(
    () =>
      appState === 'active' &&
      !!netInfoState.isConnected &&
      !!netInfoState.isInternetReachable,
    [appState, netInfoState.isConnected, netInfoState.isInternetReachable]
  );
  return {
    backendReachable,
    netInfoState,
  };
}
