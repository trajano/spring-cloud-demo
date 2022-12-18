import type { NetInfoState } from '@react-native-community/netinfo';
import { useMemo } from 'react';
import type { EndpointConfiguration } from './EndpointConfiguration';
import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';
import { useNetInfoState } from './useNetInfoState';

type RenderOnTokenEventState = {
  /**
   * Token is refreshable
   */
  tokenRefreshable: boolean;
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
 * @param timeBeforeExpirationRefresh Time in seconds to consider refreshing the access token.  Defaults to 10.
 */
export function useRenderOnTokenEvent(
  endpointConfiguration: EndpointConfiguration,
): RenderOnTokenEventState {
  /**
   * App State
   */
  const appState = useAppStateWithNetInfoRefresh();

  /**
   * Net info state.
   */
  const netInfoState = useNetInfoState(
    endpointConfiguration,
  );

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
    netInfoState,
  };
}
