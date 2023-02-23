import type { InternalProviderState } from '../InternalProviderState';
import { useAuthenticatedStateEffect } from './useAuthenticatedStateEffect';
import { useBackendFailureStateEffect } from './useBackendFailureStateEffect';
import { useBackendInaccessibleStateEffect } from './useBackendInaccessibleStateEffect';
import { useNeedsRefreshStateEffect } from './useNeedsRefreshStateEffect';
import { useRefreshingStateEffect } from './useRefreshingStateEffect';
import { useRestoringStateEffect } from './useRestoringStateEffect';
import { useTokenRemovalState } from './useTokenRemovalState';

export const useTokenAvailableEffect = (
  internalProviderState: InternalProviderState
) => {
  useAuthenticatedStateEffect(internalProviderState);
  useBackendFailureStateEffect(internalProviderState);
  useBackendInaccessibleStateEffect(internalProviderState);
  // useBackgroundedStateEffect(internalProviderState);
  useNeedsRefreshStateEffect(internalProviderState);
  useRefreshingStateEffect(internalProviderState);
  useRestoringStateEffect(internalProviderState);
  useTokenRemovalState(internalProviderState);
};
