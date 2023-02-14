import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';
export const useUnauthenticatedOfflineStateEffect = ({
  authState,
  backendReachable,
  setAuthState,
}: InternalProviderState) => {
  useEffect(() => {
    if (authState !== AuthState.UNAUTHENTICATED_OFFLINE) {
      return;
    }
    if (backendReachable) {
      setAuthState(AuthState.UNAUTHENTICATED);
    }
  }, [authState, backendReachable, setAuthState]);
};
