import { Dispatch, useEffect } from 'react';

import { AuthState } from '../../AuthState';

export const useUnauthenicatedStateEffect = ({
  authState,
  backendReachable,
  setAuthState,
}: {
  authState: AuthState;
  backendReachable: boolean;
  setAuthState: Dispatch<AuthState>;
}) => {
  useEffect(() => {
    if (authState !== AuthState.UNAUTHENTICATED) {
      return;
    }
    if (!backendReachable) {
      setAuthState(AuthState.UNAUTHENTICATED_OFFLINE);
    }
  }, [authState, backendReachable, setAuthState]);
};
