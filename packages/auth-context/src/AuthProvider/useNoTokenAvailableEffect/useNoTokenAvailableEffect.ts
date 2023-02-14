import { useUnauthenticatedOfflineStateEffect } from './useUnauthenticatedOfflineStateEffect';
import { useUnauthenicatedStateEffect } from './useUnauthenticatedStateEffect';
import type { InternalProviderState } from '../InternalProviderState';

export const useNoTokenAvailableEffect = (
  providerState: InternalProviderState
) => {
  useUnauthenicatedStateEffect(providerState);
  useUnauthenticatedOfflineStateEffect(providerState);
};
