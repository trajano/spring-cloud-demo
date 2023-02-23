import NetInfo from '@react-native-community/netinfo';
import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useBackgroundedStateEffect = ({
  appActive,
  notify,
  backendReachable,
  authState,
  setAuthState,
  signaled
}: InternalProviderState) => {
  useEffect(() => {
    if (!signaled) {
    }
    else if (authState === AuthState.BACKGROUNDED) {
      // if (appActive) {
      //   setAuthState(AuthState.NEEDS_REFRESH);
      // }
      (async () => {
        if (appActive) {
          notify({
            type: 'CheckRefresh',
            authState,
            reason: 'App was activated',
            backendReachable,
          });
              await NetInfo.refresh();

          setAuthState(AuthState.NEEDS_REFRESH);
        } else {
          notify({
            type: 'CheckRefresh',
            authState,
            reason: 'App was backgrounded',
            backendReachable,
          });
        }
      })();
    } else {
      if (!appActive) {
        setAuthState(AuthState.BACKGROUNDED);
      }
    }
  }, [appActive, authState, notify, backendReachable, setAuthState]);
};
