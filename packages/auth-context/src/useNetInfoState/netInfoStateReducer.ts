import type { NetInfoState } from '@react-native-community/netinfo';

/**
 * Since only the values of type (when switching from mobile to wifi which may
 * change IPs), isConnected (connection) and isInternetReachable (connection to
 * server) are relevant. Only those should trigger a state change.
 */
export function netInfoStateReducer(
  prev: NetInfoState,
  next: NetInfoState
): NetInfoState {
  if (
    prev.type === next.type &&
    prev.isConnected === next.isConnected &&
    prev.isInternetReachable === next.isInternetReachable
  ) {
    return prev;
  } else {
    return next;
  }
}
