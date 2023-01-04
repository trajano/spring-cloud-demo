import type { NetInfoState } from '@react-native-community/netinfo';
import { useMemo } from 'react';
import type { EndpointConfiguration } from '../EndpointConfiguration';
import { useNetInfoState } from '../useNetInfoState';
import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';

/**
 * @testonly
 */
export type RenderOnTokenEventProps = {
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
