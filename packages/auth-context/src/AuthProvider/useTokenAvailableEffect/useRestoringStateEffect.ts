import noop from 'lodash/noop';
import { useCallback, useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useRestoringStateEffect = ({
  appActive,
  appDataLoaded,
  authState,
  waitForSignalWhenDataIsLoaded,
  notify,
  setAuthState,
  setAppDataLoaded,
}: InternalProviderState) => {
  const signalDataLoaded = useCallback(() => {
    setAppDataLoaded(true);
    setAuthState(AuthState.NEEDS_REFRESH);
    notify({
      type: 'DataLoaded',
      authState,
      reason: 'Data loaded signal called',
    });
  }, [authState, notify, setAppDataLoaded, setAuthState]);

  useEffect(() => {
    if (authState === AuthState.RESTORING) {
      if (__DEV__ && appDataLoaded) {
        console.warn('attempted to restore while app data already loaded');
      }
      if (waitForSignalWhenDataIsLoaded) {
        notify({
          type: 'WaitForDataLoaded',
          authState,
          reason: 'in Restoring state',
          signalDataLoaded,
        });
      } else {
        setAuthState(AuthState.NEEDS_REFRESH);
        notify({
          type: 'DataLoaded',
          authState,
          reason: 'automatically transitioning since wait is not required',
        });
      }
    }
    return noop;
  }, [
    appActive,
    appDataLoaded,
    authState,
    notify,
    setAuthState,
    signalDataLoaded,
    waitForSignalWhenDataIsLoaded,
  ]);
};
