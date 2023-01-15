import { Dispatch, useEffect } from 'react';
import { AppState } from 'react-native';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import type { OAuthToken } from '../OAuthToken';
import { isTokenExpired } from './isTokenExpired';
/** @testonly */
export interface AppStateRefreshingProps {
  authState: AuthState;
  setAuthState: Dispatch<AuthState>;
  notify: (event: AuthEvent) => void;
  /** Indicates that the token is refreshable from the device. */
  backendReachable: boolean;
  oauthToken: OAuthToken | null;
  tokenExpiresAt: Date | null;
  timeBeforeExpirationRefresh: number;
}
export function useAppStateRefreshingEffect({
  authState,
  setAuthState,
  notify,
  backendReachable,
  oauthToken,
  tokenExpiresAt,
  timeBeforeExpirationRefresh,
}: AppStateRefreshingProps): void {
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        if (nextAppState === 'active' && authState === AuthState.REFRESHING) {
          const tokenExpired = isTokenExpired(
            tokenExpiresAt,
            timeBeforeExpirationRefresh
          );
          notify({
            type: 'CheckRefresh',
            authState,
            reason:
              'AuthState === REFRESHING and AppState just switched to active, forcing recheck',
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
      }
    );
    return () => {
      appStateSubscription.remove();
    };
  }, [
    authState,
    setAuthState,
    notify,
    oauthToken,
    backendReachable,
    tokenExpiresAt,
    timeBeforeExpirationRefresh,
  ]);
}
