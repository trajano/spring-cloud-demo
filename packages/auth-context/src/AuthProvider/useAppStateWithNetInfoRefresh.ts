import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppStateWithNetInfoRefresh(): AppStateStatus {
  /** App State */
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  useEffect(
    /** Monitors app state changes. */
    () => {
      const appStateSubscription = AppState.addEventListener(
        'change',
        (nextAppState) => {
          if (nextAppState === 'active') {
            // if the app switches to active, force a NetInfo refresh
            NetInfo.refresh().catch(console.error);
          }
          setAppState(nextAppState);
        }
      );
      return () => {
        appStateSubscription.remove();
      };
    },
    []
  );
  return appState;
}
