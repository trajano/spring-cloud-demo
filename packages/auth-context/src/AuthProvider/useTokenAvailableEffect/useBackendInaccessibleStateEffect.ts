import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useBackendInaccessibleStateEffect = ({
  authState,
  backendReachable,
  setAuthState,
}: InternalProviderState) => {
  useEffect(() => {
    if (authState !== AuthState.BACKEND_INACCESSIBLE) {
      return noop;
    }
    if (backendReachable) {
      setAuthState(AuthState.NEEDS_REFRESH);
      return noop;
    }
    return noop;
  }, [authState, backendReachable, setAuthState]);
};
