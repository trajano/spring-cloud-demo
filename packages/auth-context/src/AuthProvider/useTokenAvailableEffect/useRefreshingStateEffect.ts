import noop from 'lodash/noop';
import { useEffect, useRef } from 'react';

import { AuthState } from '../../AuthState';
import { AuthenticationClientError } from '../../AuthenticationClientError';
import type { InternalProviderState } from '../InternalProviderState';

export const useRefreshingStateEffect = ({
  authStorage,
  authState,
  authClient,
  backendReachable,
  oauthToken,
  notify,
  setAuthState,
  timeBeforeExpirationRefresh,
  tokenExpiresAt,
  setTokenExpiresAt,
  setOAuthToken,
}: InternalProviderState) => {
  const refreshingInProgressRef = useRef(false);
  useEffect(() => {
    if (authState !== AuthState.REFRESHING) {
      return noop;
    }
    (async () => {
      if (refreshingInProgressRef.current) {
        return;
      }
      refreshingInProgressRef.current = true;
      if (!oauthToken) {
        throw new Error('Unable to refresh without token');
      }
      try {
        const nextOAuthToken = await authClient.refreshAsync(
          oauthToken.refresh_token
        );
        const nextTokenExpiresAt =
          await authStorage.storeOAuthTokenAndGetExpiresAtAsync(nextOAuthToken);
        notify({
          type: 'Authenticated',
          authState,
          accessToken: nextOAuthToken.access_token,
          authorization: `Bearer ${nextOAuthToken.access_token}`,
          tokenExpiresAt: nextTokenExpiresAt,
          reason: 'from refresh',
        });
        setOAuthToken(nextOAuthToken);
        setTokenExpiresAt(nextTokenExpiresAt);
        setAuthState(AuthState.AUTHENTICATED);
      } catch (error: unknown) {
        if (
          error instanceof AuthenticationClientError &&
          error.isUnauthorized()
        ) {
          setAuthState(AuthState.TOKEN_REMOVAL);
        } else if (error instanceof AuthenticationClientError) {
          notify({
            type: 'TokenExpiration',
            authState,
            reason: error.message,
            error,
            responseBody: error.responseBody,
          });
          setAuthState(AuthState.BACKEND_FAILURE);
        } else {
          setAuthState(AuthState.BACKEND_FAILURE);
        }
      } finally {
        refreshingInProgressRef.current = false;
      }
    })();
    return noop;
  }, [
    authClient,
    authState,
    authStorage,
    backendReachable,
    notify,
    oauthToken,
    setAuthState,
    setOAuthToken,
    setTokenExpiresAt,
    timeBeforeExpirationRefresh,
    tokenExpiresAt,
  ]);
};
