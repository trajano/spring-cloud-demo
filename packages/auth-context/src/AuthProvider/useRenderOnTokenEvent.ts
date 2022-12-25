import type { NetInfoState } from '@react-native-community/netinfo';
import { Dispatch, useEffect, useMemo } from 'react';
import type { EndpointConfiguration } from '../EndpointConfiguration';
import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';
import { useNetInfoState } from '../useNetInfoState';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { isTokenExpired } from './isTokenExpired';
import type { OAuthToken } from '../OAuthToken';

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
 * - if the connectivty changes to true and it's in REFRESHING state, then it will switch to either AUTHENTICATED or NEEDS_REFRESH accordingly.
 * @param endpointConfiguration to obtain the ping URL
 */
export function useRenderOnTokenEvent({
  authState,
  setAuthState,
  notify,
  oauthToken,
  tokenExpiresAt,
  timeBeforeExpirationRefresh,
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
    [appState, netInfoState.isConnected, !!netInfoState.isInternetReachable]
  );

  useEffect(() => {
    if (authState === AuthState.REFRESHING && backendReachable) {
      const tokenExpired = isTokenExpired(
        tokenExpiresAt,
        timeBeforeExpirationRefresh
      );
      notify({
        type: 'CheckRefresh',
        authState,
        reason:
          'Token is refreshing but backendReachable switched to true, forcing recheck',
        backendReachable,
        tokenExpiresAt,
        tokenExpired,
      });
      if (!tokenExpired && oauthToken && tokenExpiresAt) {
        // token present and not expired yet, so authenticated
        setAuthState(AuthState.AUTHENTICATED);
        notify({
          type: 'Authenticated',
          authState,
          reason: 'active token restored from context state',
          accessToken: oauthToken.access_token,
          authorization: `Bearer ${oauthToken.access_token}`,
          tokenExpiresAt,
        });
      } else {
        // token has expired so needs refresh
        setAuthState(AuthState.NEEDS_REFRESH);
        notify({
          type: 'TokenExpiration',
          authState,
          reason: 'expired token restored from context state',
        });
      }
    }
  }, [backendReachable]);

  return {
    backendReachable,
    lastCheckTime: 0,
    netInfoState,
  };
}
