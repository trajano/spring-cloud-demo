import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export const useAppActiveState = (): boolean => {
  const [appActiveState, setAppActiveState] = useState(
    AppState.currentState === 'active'
  );
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        setAppActiveState(nextAppState === 'active');
      }
    );
    return () => appStateSubscription.remove();
  }, []);
  return appActiveState;
};
