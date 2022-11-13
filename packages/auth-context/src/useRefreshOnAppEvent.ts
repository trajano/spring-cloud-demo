import NetInfo, {
  NetInfoState,
  NetInfoStateType
} from '@react-native-community/netinfo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { AuthEvent } from './AuthEvent';
import { AuthState } from './AuthState';
import type { AuthStore } from './AuthStore';

type RefreshOnAppEventState = {
  tokenRefreshable: boolean;
};
/**
 * This hook registers an effect that manages subscriptions to app change or connectivity change events.
 * It also has state about connectivity
 * @param baseUrl base URL which will be prepended to provide the connectivity URL check
 * @param notify the callback that handles notifications
 * @param refresh the callback that handles refresh
 * @param needRefresh the callback that gets called when the expiration timeout is fired.  This should trigger a state change.
 * @param timeBeforeExpirationRefresh time in seconds before expiration to consider the token needing refresh
 * @param timeBeforeBackendFailureRetry time in seconds before retrying a backend failure
 * @param authStore storage for auth data
 * @param authState current authentication state
 */
export function useRefreshOnAppEvent(
  baseUrl: string,
  notify: (event: AuthEvent) => void,
  refresh: () => Promise<void>,
  needRefresh: () => void,
  timeBeforeExpirationRefresh: number,
  timeBeforeBackendFailureRetry: number,
  authStore: AuthStore,
  authState: AuthState
): RefreshOnAppEventState {
  /**
   * Expiration timeout ID ref.  This is a timeout that executes when the OAuth timeout is less than X (default to 10) seconds away from expiration.
   * When it reaches the expiration it will set the state to NEEDS_REFRESH.
   * The timeout is cleared on unmount, logout or refresh.
   */
  const expirationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const clearExpirationTimeout = useCallback(() => {
    clearTimeout(expirationTimeoutRef.current);
    expirationTimeoutRef.current = undefined;
  }, [expirationTimeoutRef]);

  const [netInfoState, setNetInfoState] = useState<NetInfoState>({
    type: NetInfoStateType.unknown,
    isConnected: false,
    isInternetReachable: null,
    details: null,
  });
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const tokenRefreshable = useMemo<boolean>(() => (
    appState === 'active' &&
    !!netInfoState.isConnected &&
    !!netInfoState.isInternetReachable
  ), [appState, netInfoState.isConnected, !!netInfoState.isInternetReachable]);

  useEffect(() => {
    // simply notify when there's a connection change.
    notify({ type: 'Connection', netInfoState });
  }, [netInfoState]);

  useEffect(() => {
    // there's a state change determine if we need to refresh.
    (async () => {
      if (!tokenRefreshable && expirationTimeoutRef.current) {
        // the app is not in a state where the token can be refreshed and there is still an active timeout
        clearExpirationTimeout();
      } else if (
        tokenRefreshable &&
        (authState === AuthState.NEEDS_REFRESH ||
          authState === AuthState.INITIAL)
      ) {
        notify({
          type: 'Refreshing',
          reason: `Token is refreshable and auth state=${AuthState[authState]}`,
        });
        clearExpirationTimeout();
        await refresh();
      } else if (
        tokenRefreshable &&
        authState === AuthState.BACKEND_FAILURE &&
        !expirationTimeoutRef.current
      ) {
        // the token is refreshable and there was a backend failure but the timeout is not yet set
        expirationTimeoutRef.current = setTimeout(
          needRefresh,
          timeBeforeBackendFailureRetry * 1000
        );
      } else if (
        tokenRefreshable &&
        authState === AuthState.AUTHENTICATED &&
        !expirationTimeoutRef.current
      ) {
        // the token is refreshable and authenticated but the timeout is not yet set
        const expiresIn =
          (await authStore.getTokenExpiresAt()).getTime() -
          Date.now() -
          timeBeforeExpirationRefresh * 1000;
        expirationTimeoutRef.current = setTimeout(needRefresh, expiresIn);
      }
    })();
  }, [tokenRefreshable, authState]);

  useEffect(function restoreSubscriptionsAndTimeout() {
    NetInfo.configure({
      reachabilityUrl: baseUrl + '/ping',
      reachabilityTest: (response) => Promise.resolve(response.status === 200),
      useNativeReachability: true,
    });
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        console.log({ nextAppState });
        if (nextAppState === 'active') {
          // if the app switches to active, force a NetInfo refresh
          NetInfo.refresh();
        }
        setAppState(nextAppState);
      }
    );
    const unsubscribeNetInfo = NetInfo.addEventListener((nextNetInfoState) => {
      setNetInfoState(nextNetInfoState);
    });
    NetInfo.refresh().then(() => {
      console.log({ netInfoState });

      refresh();
    });
    console.log('useRefresh');
    return () => {
      appStateSubscription.remove();
      unsubscribeNetInfo();
      clearExpirationTimeout();
    };
  }, []);

  return { tokenRefreshable };
}
