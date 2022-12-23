import type { NetInfoState } from '@react-native-community/netinfo';
import type { Dispatch, SetStateAction } from 'react';
import type { AuthClient } from '../AuthClient';
import { AuthenticationClientError } from '../AuthenticationClientError';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import type { IAuthStore } from '../AuthStore';
import type { OAuthToken } from '../OAuthToken';

/**
 * @testonly
 */
export type RefreshCallbackProps<T> = {
  authState: AuthState;
  setAuthState: Dispatch<SetStateAction<AuthState>>;
  notify: (event: AuthEvent) => void;
  authStorage: IAuthStore;
  authClient: AuthClient<T>;
  /**
   * Indicates that the token is refreshable from the device.
   */
  tokenRefreshable: boolean;
  netInfoState: NetInfoState;
  oauthToken: OAuthToken | null;
  setOAuthToken: Dispatch<OAuthToken | null>;
  setTokenExpiresAt: Dispatch<Date | number>;
};

/**
 * This provides the refresh function.  It is extracted so that specific tests can be performed without relying on the whole component.
 */
export function useRefreshCallback<T>({
  authState,
  setAuthState,
  notify,
  oauthToken,
  authStorage,
  authClient,
  setOAuthToken,
  setTokenExpiresAt,
  tokenRefreshable,
  netInfoState,
}: RefreshCallbackProps<T>): () => Promise<void> {
  async function refresh() {
    if (authState === AuthState.REFRESHING) {
      notify({
        type: 'Refreshing',
        authState,
        reason: 'Already in progress',
      });
      return;
    }
    setAuthState(AuthState.REFRESHING);
    notify({
      type: 'Refreshing',
      authState,
      reason: 'Requested',
    });
    try {
      if (!oauthToken) {
        // refresh wat attempted when oauth token is not available. This may occur when the state is being
        // resolved
        setAuthState(AuthState.UNAUTHENTICATED);
        notify({
          type: 'Unauthenticated',
          authState,
          reason: 'Token data was lost while refreshing',
        });
      } else if (!tokenRefreshable) {
        // refresh was attempted when the backend is not available.  This may occur when refresh is forced.
        setAuthState(AuthState.BACKEND_INACCESSIBLE);
        notify({
          type: 'TokenExpiration',
          authState,
          reason: 'Backend is not available and token refresh was requested',
          netInfoState,
        });
      } else {
        try {
          const refreshedOAuthToken = await authClient.refresh(
            oauthToken.refresh_token
          );
          const nextTokenExpiresAt =
            await authStorage.storeOAuthTokenAndGetExpiresAt(
              refreshedOAuthToken
            );
          setOAuthToken(refreshedOAuthToken);
          setTokenExpiresAt(nextTokenExpiresAt);
          setAuthState(AuthState.AUTHENTICATED);
          notify({
            type: 'Authenticated',
            reason: 'Refreshed',
            authState,
            accessToken: refreshedOAuthToken.access_token,
            authorization: `Bearer ${refreshedOAuthToken.access_token}`,
            tokenExpiresAt: nextTokenExpiresAt,
          });
        } catch (e: unknown) {
          if (e instanceof AuthenticationClientError && e.isUnauthorized()) {
            await authStorage.clear();
            setOAuthToken(null);
            setTokenExpiresAt(0);
            setAuthState(AuthState.UNAUTHENTICATED);
            notify({
              type: 'Unauthenticated',
              authState,
              reason: e.message,
              responseBody: e.responseBody,
            });
          } else if (
            e instanceof AuthenticationClientError &&
            !e.isUnauthorized()
          ) {
            // at this point there is an error but it's not something caused by the user so don't clear off the token
            //    lastBackendFailureAttemptRef.current = lastCheckTime;
            setAuthState(AuthState.BACKEND_FAILURE);
            notify({
              type: 'TokenExpiration',
              authState,
              reason: e.message,
              responseBody: e.responseBody,
              netInfoState,
            });
          } else {
            console.error("unexpected exception ", e)
            throw e;
          }
        }
      }
    } finally {
      // const { oauthToken, tokenExpiresAt } = updateFromStorage();
      // some how make thi
    }
  }
  return refresh;
}
