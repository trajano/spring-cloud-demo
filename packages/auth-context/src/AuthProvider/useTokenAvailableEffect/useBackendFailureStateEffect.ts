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
      setAuthState(AuthState.NEEDS_REFRESH);
    }, 2000);
    return () => clearTimeout(timeoutID);
  }, [authState, notify, setAuthState]);
};
