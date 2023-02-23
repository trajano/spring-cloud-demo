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
  }, [setAppDataLoaded]);

  useEffect(() => {
    if (authState === AuthState.RESTORING) {
      if (appDataLoaded && waitForSignalWhenDataIsLoaded) {
        setAuthState(AuthState.NEEDS_REFRESH);
        notify({
          type: 'DataLoaded',
          authState,
          reason: 'Data loaded signal called, which set appDataLoaded to true',
        });
      } else if (!appDataLoaded && waitForSignalWhenDataIsLoaded) {
        notify({
          type: 'WaitForDataLoaded',
          authState,
          reason: 'in Restoring state',
          signalDataLoaded,
        });
      } else if (!waitForSignalWhenDataIsLoaded) {
        setAppDataLoaded(true);
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
    setAppDataLoaded,
    signalDataLoaded,
    waitForSignalWhenDataIsLoaded,
  ]);
};
