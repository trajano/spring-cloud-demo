import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useBackendFailureStateEffect = ({
  authState,
  setAuthState,
}: InternalProviderState) => {
  useEffect(() => {
    if (authState !== AuthState.BACKEND_FAILURE) {
      return noop;
    }
    const timeoutID = setTimeout(() => {
      setAuthState(AuthState.NEEDS_REFRESH);
    }, 2000);
    return () => clearTimeout(timeoutID);
  }, [authState, setAuthState]);
};
