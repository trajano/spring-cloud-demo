import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useTokenRemovalState = ({
  authStorage,
  authState,
  notify,
  setAuthState,
  setAppDataLoaded,
  setTokenExpiresAt,
  setOAuthToken,
}: InternalProviderState) => {
  useEffect(() => {
    if (authState !== AuthState.TOKEN_REMOVAL) {
      return noop;
    }
    (async () => {
      await authStorage.clearAsync();
      notify({
        type: 'Unauthenticated',
        authState,
        reason: 'Token removed',
      });
      setOAuthToken(null);
      setAppDataLoaded(false);
      setTokenExpiresAt(new Date(0));
      setAuthState(AuthState.UNAUTHENTICATED);
    })();
    return noop;
  }, [
    authState,
    authStorage,
    notify,
    setAuthState,
    setOAuthToken,
    setTokenExpiresAt,
  ]);
};
