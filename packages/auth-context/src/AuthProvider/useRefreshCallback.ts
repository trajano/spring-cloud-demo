import type { NetInfoState } from '@react-native-community/netinfo';
import { Dispatch, SetStateAction, useCallback, useRef } from 'react';
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
  backendReachable: boolean;
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
  backendReachable,
  netInfoState,
}: RefreshCallbackProps<T>): () => Promise<void> {
  const refreshingRef = useRef(false);
  const refreshAsync = useCallback(
    async (reason = 'Requested') => {
      if (refreshingRef.current) {
        notify({
          type: 'Refreshing',
          authState,
          reason: 'Already in progress',
        });
        return;
      }
      refreshingRef.current = true;
      setAuthState(AuthState.REFRESHING);
      notify({
        type: 'Refreshing',
        authState,
        reason,
      });
      try {
        if (!oauthToken) {
          /*
           * refresh wat attempted when oauth token is not available. This may occur when the state is being
           * resolved
           */
          setAuthState(AuthState.UNAUTHENTICATED);
          notify({
            type: 'Unauthenticated',
            authState,
            reason: 'Token data was lost while refreshing',
          });
        } else if (!backendReachable) {
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
            const refreshedOAuthToken = await authClient.refreshAsync(
              oauthToken.refresh_token
            );
            const nextTokenExpiresAt =
              await authStorage.storeOAuthTokenAndGetExpiresAtAsync(
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
              await authStorage.clearAsync();
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
              notify({
                type: 'TokenExpiration',
                authState,
                reason: e.message,
                responseBody: e.responseBody,
                netInfoState,
                error: e,
              });
              setAuthState(AuthState.BACKEND_FAILURE);
            } else {
              console.error('unexpected exception ', e);
              throw e;
            }
          }
        }
      } finally {
        /*
         * const { oauthToken, tokenExpiresAt } = updateFromStorage();
         * some how make thi
         */
        refreshingRef.current = false;
      }
    },
    [
      authState,
      notify,
      authClient,
      authStorage,
      backendReachable,
      netInfoState,
      oauthToken,
      setAuthState,
      setOAuthToken,
      setTokenExpiresAt,
    ]
  );
  return refreshAsync;
}
