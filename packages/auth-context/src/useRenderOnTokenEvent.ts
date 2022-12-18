import type { NetInfoState } from '@react-native-community/netinfo';
import { useMemo } from 'react';
import type { AuthState } from './AuthState';
import type { EndpointConfiguration } from './EndpointConfiguration';
import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';
import { useNetInfoState } from './useNetInfoState';
import { useTokenCheckClock } from './useTokenCheckClock';

type RenderOnTokenEventState = {
  /**
   * Token is refreshable
   */
  tokenRefreshable: boolean;
  /**
   * Last time the token was checked.
   */
  lastCheckTime: number;
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
 * @param endpointConfiguration to obtain the ping URL
 * @param tokenExpiresAt when does the token expire
 * @param timeBeforeExpirationRefresh Time in milliseconds to consider refreshing the access token.  Defaults to 10000.
 * @param authState Authentication state
 */
export function useRenderOnTokenEvent(
  endpointConfiguration: EndpointConfiguration,
  tokenExpiresAt: Date | null,
  timeBeforeExpirationRefresh: number,
  authState: AuthState
): RenderOnTokenEventState {
  /**
   * App State
   */
  const appState = useAppStateWithNetInfoRefresh();
  const { lastCheckTime } = useTokenCheckClock(
    authState,
    tokenExpiresAt,
    timeBeforeExpirationRefresh
  );

  /**
   * Net info state.
   */
  const netInfoState = useNetInfoState(endpointConfiguration);

  /**
   * Token is refreshable if the app is active, there's a connection and the backend is reachable.
   */
  const tokenRefreshable = useMemo<boolean>(
    () =>
      appState === 'active' &&
      !!netInfoState.isConnected &&
      !!netInfoState.isInternetReachable,
    [appState, netInfoState.isConnected, !!netInfoState.isInternetReachable]
  );

  return {
    tokenRefreshable,
    lastCheckTime,
    netInfoState,
  };
}
