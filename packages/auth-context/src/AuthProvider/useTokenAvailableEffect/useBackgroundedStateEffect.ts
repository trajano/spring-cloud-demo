import NetInfo from '@react-native-community/netinfo';
import noop from 'lodash/noop';
import { useEffect } from 'react';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useBackgroundedStateEffect = ({
  appActive,
  authState,
  setAuthState,
}: InternalProviderState) => {
  useEffect(() => {
    if (authState === AuthState.BACKGROUNDED) {
      // if (appActive) {
      //   setAuthState(AuthState.NEEDS_REFRESH);
      // }
      (async () => {
        if (appActive) {
          await NetInfo.refresh();
          setAuthState(AuthState.NEEDS_REFRESH);
        }
      })();
    } else {
      if (!appActive) {
        setAuthState(AuthState.BACKGROUNDED);
      }
    }
    return noop;
  }, [appActive, authState, setAuthState]);
};
