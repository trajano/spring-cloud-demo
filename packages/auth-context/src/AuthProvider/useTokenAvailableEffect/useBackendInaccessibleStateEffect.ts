import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useBackendInaccessibleStateEffect = ({
  authState,
  backendReachable,
  notify,
  setAuthState,
}: InternalProviderState) => {
  useEffect(() => {
    if (authState !== AuthState.BACKEND_INACCESSIBLE) {
      return noop;
    }
    if (backendReachable) {
      notify({
        type: 'PingSucceeded',
        authState,
        reason: `Backend was determined to be not reachable while authenticated`,
        backendReachable,
      });

      setAuthState(AuthState.DISPATCHING);
      return noop;
    }
    return noop;
  }, [authState, backendReachable, notify, setAuthState]);
};
