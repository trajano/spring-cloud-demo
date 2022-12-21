import type { NetInfoState } from '@react-native-community/netinfo';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { AuthClient } from '../AuthClient';
import { AuthenticationClientError } from '../AuthenticationClientError';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import type { AuthStore } from '../AuthStore';
import type { OAuthToken } from '../OAuthToken';
import { updateTokenInfoRef } from './updateTokenInfoRef';

/**
 * @testonly
 */
export type RefreshCallbackProps<T> = {
  authState: AuthState;
  setAuthState: Dispatch<SetStateAction<AuthState>>;
  notify: (event: AuthEvent) => void;
  authStorage: AuthStore;
  authClient: AuthClient<T>;
  /**
   * Indicates that the token is refreshable from the device.
   */
  tokenRefreshable: boolean;
  netInfoState: NetInfoState;
  oauthTokenRef: MutableRefObject<OAuthToken | null>;
  tokenExpiresAtRef: MutableRefObject<Date | null>;
};

/**
 * This provides the refresh function.  It is extracted so that specific tests can be performed without relying on the whole component.
 */
export function useRefreshCallback<T>({
  authState,
  setAuthState,
  notify,
  authStorage,
  authClient,
  tokenRefreshable,
  netInfoState,
  oauthTokenRef,
  tokenExpiresAtRef,
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
    const storedOAuthToken = await authStorage.getOAuthToken();
    if (storedOAuthToken == null) {
      // No token stored. Normally should not happen hear unless the token was removed from storage by
      // some means other than the API.
      setAuthState(AuthState.UNAUTHENTICATED);
      notify({
        type: 'Unauthenticated',
        authState,
        reason: 'No token stored. Normally should not happen here.',
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
          storedOAuthToken.refresh_token
        );
        const nextTokenExpiresAt =
          await authStorage.storeOAuthTokenAndGetExpiresAt(refreshedOAuthToken);
        await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
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
          await updateTokenInfoRef(
            authStorage,
            oauthTokenRef,
            tokenExpiresAtRef
          );
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
          throw e;
        }
      }
    }
  }
  return refresh;
}
