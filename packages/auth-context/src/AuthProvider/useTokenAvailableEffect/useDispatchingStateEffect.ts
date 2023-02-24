import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';
import { isTokenExpired } from '../isTokenExpired';

export const useDispatchingStateEffect = ({
  authState,
  backendReachable,
  oauthToken,
  setAuthState,
  notify,
  timeBeforeExpirationRefresh,
  tokenExpiresAt,
}: InternalProviderState) => {
  useEffect(() => {
    if (authState !== AuthState.DISPATCHING) {
      return noop;
    }

    if (!backendReachable) {
      notify({
        type: 'PingFailed',
        authState,
        reason: `Backend was determined to be not reachable`,
        backendReachable,
      });
      setAuthState(AuthState.BACKEND_INACCESSIBLE);
    } else if (
      !isTokenExpired(tokenExpiresAt, timeBeforeExpirationRefresh) &&
      oauthToken
    ) {
      // notify({
      //   type: 'Authenticated',
      //   authState,
      //   reason: 'from NeedsRefeshStateEffect',
      //   accessToken: oauthToken.access_token,
      //   authorization: `Bearer ${oauthToken.access_token}`,
      //   tokenExpiresAt,
      // });
      setAuthState(AuthState.USABLE_TOKEN);
    } else {
      notify({
        type: 'Refreshing',
        authState,
        reason: 'from NeedsRefeshStateEffect',
      });
      setAuthState(AuthState.REFRESHING);
    }
    return noop;
  }, [
    authState,
    backendReachable,
    notify,
    oauthToken,
    setAuthState,
    timeBeforeExpirationRefresh,
    tokenExpiresAt,
  ]);
};
