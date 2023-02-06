import NetInfo, {
  NetInfoState,
  NetInfoStateType,
} from '@react-native-community/netinfo';
import { useEffect, useReducer } from 'react';

import { netInfoStateReducer } from './netInfoStateReducer';
import type { EndpointConfiguration } from '../EndpointConfiguration';

/**
 * Similar to the function of @react-native-community/netinfo useNetInfo, but
 * locked down here to ensure that configuration is updated on the NetInfo
 * level.
 *
 * @param endpoint Configuration to obtain the ping endpoint
 * @param onNetInfoUnsubscribe Invoked when the subscription is going to be
 *   removed.
 */
export function useNetInfoState(
  endpointConfiguration: Pick<EndpointConfiguration, 'pingEndpoint'>,
  onNetInfoUnsubscribe?: () => void
): NetInfoState {
  /** Net info state. */
  const [netInfoState, updateNetInfoState] = useReducer(netInfoStateReducer, {
    type: NetInfoStateType.unknown,
    isConnected: null,
    isInternetReachable: null,
    details: null,
  });
  useEffect(
    /** Monitors network state changes. */
    () => {
      NetInfo.configure({
        reachabilityUrl: endpointConfiguration.pingEndpoint,
        reachabilityTest: (response) =>
          Promise.resolve(response.status === 200 || response.status === 204),
        useNativeReachability: true,
      });

      const unsubscribeNetInfo = NetInfo.addEventListener(
        (nextNetInfoState) => {
          updateNetInfoState(nextNetInfoState);
        }
      );

      NetInfo.refresh()
        .then((nextNetInfoState) => {
          updateNetInfoState(nextNetInfoState);
        })
        .catch(console.error);
      return () => {
        unsubscribeNetInfo();
        onNetInfoUnsubscribe?.();
      };
    },
    [endpointConfiguration, onNetInfoUnsubscribe]
  );
  return netInfoState;
}
