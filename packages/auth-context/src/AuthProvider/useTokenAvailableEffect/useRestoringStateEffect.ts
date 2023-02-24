import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useRestoringStateEffect = ({
  appDataLoaded,
  authState,
  waitForSignalWhenDataIsLoaded,
  notify,
  setAuthState,
  signalAppDataLoaded,
}: InternalProviderState) => {
  useEffect(() => {
    if (authState === AuthState.RESTORING) {
      if (appDataLoaded && waitForSignalWhenDataIsLoaded) {
        setAuthState(AuthState.DISPATCHING);
        notify({
          type: 'DataLoaded',
          authState,
          reason: 'Data loaded signal called, which set appDataLoaded to true',
        });
      } else if (!appDataLoaded && waitForSignalWhenDataIsLoaded) {
        notify({
          type: 'WaitForDataLoaded',
          authState,
          reason: `in Restoring state`,
          appDataLoaded,
          signalDataLoaded: signalAppDataLoaded,
        });
      } else if (!waitForSignalWhenDataIsLoaded) {
        signalAppDataLoaded();
        setAuthState(AuthState.DISPATCHING);
        notify({
          type: 'DataLoaded',
          authState,
          reason: 'automatically transitioning since wait is not required',
        });
      }
    }
    return noop;
  }, [
    appDataLoaded,
    authState,
    notify,
    setAuthState,
    signalAppDataLoaded,
    waitForSignalWhenDataIsLoaded,
  ]);
};
