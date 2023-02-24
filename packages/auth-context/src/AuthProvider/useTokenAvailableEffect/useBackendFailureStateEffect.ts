import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useBackendFailureStateEffect = ({
  authState,
  notify,
  setAuthState,
}: InternalProviderState) => {
  useEffect(() => {
    if (authState !== AuthState.BACKEND_FAILURE) {
      return noop;
    }
    notify({
      authState,
      reason: 'timeout for backend failure retry set',
      type: 'CheckRefresh',
    });
    const timeoutID = setTimeout(() => {
      notify({
        authState,
        reason:
          'timeout for backend failure retry switching back to NeedsRefresh',
        type: 'CheckRefresh',
      });
      setAuthState(AuthState.DISPATCHING);
    }, 2000);
    return () => clearTimeout(timeoutID);
  }, [authState, notify, setAuthState]);
};
