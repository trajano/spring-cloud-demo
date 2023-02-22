import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useRestoringStateEffect = ({
  appActive,
  appDataLoaded,
  authState,
  restoreAppDataAsyncCallback,
  setAuthState,
  setAppDataLoaded,
}: InternalProviderState) => {
  useEffect(() => {
    if (authState === AuthState.RESTORING) {
      if (__DEV__ && appDataLoaded) {
        throw Error('attempted to restore while app data already loaded');
      }

      if (!appDataLoaded) {
        Promise.resolve(restoreAppDataAsyncCallback())
          .then(() => {
            setAppDataLoaded(true);
            setAuthState(AuthState.NEEDS_REFRESH);
          })
          .catch(console.error);
      }
    }
    return noop;
  }, [appActive, authState, setAuthState]);
};
