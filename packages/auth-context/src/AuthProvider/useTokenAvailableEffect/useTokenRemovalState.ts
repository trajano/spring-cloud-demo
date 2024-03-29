import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useTokenRemovalState = ({
  authStorage,
  authState,
  signaled,
  notify,
  setAuthState,
  resetAppDataLoaded,
  resetTokenProcessed,
  setTokenExpiresAt,
  setOAuthToken,
}: InternalProviderState) => {
  useEffect(() => {
    if (!signaled || authState !== AuthState.TOKEN_REMOVAL) {
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
      resetAppDataLoaded();
      resetTokenProcessed();
      setTokenExpiresAt(new Date(0));
      setAuthState(AuthState.UNAUTHENTICATED);
    })();
    return noop;
  }, [
    authState,
    authStorage,
    signaled,
    notify,
    resetAppDataLoaded,
    resetTokenProcessed,
    setAuthState,
    setOAuthToken,
    setTokenExpiresAt,
  ]);
};
