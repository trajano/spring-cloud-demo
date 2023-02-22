import { useAuthenticatedStateEffect } from './useAuthenticatedStateEffect';
import { useBackendFailureStateEffect } from './useBackendFailureStateEffect';
import { useBackendInaccessibleStateEffect } from './useBackendInaccessibleStateEffect';
import { useBackgroundedStateEffect } from './useBackgroundedStateEffect';
import { useNeedsRefreshStateEffect } from './useNeedsRefreshStateEffect';
import { useRefreshingStateEffect } from './useRefreshingStateEffect';
import { useTokenRemovalState } from './useTokenRemovalState';
import type { InternalProviderState } from '../InternalProviderState';
import { useRestoringStateEffect } from './useRestoringStateEffect';

export const useTokenAvailableEffect = (
  internalProviderState: InternalProviderState
) => {
  useAuthenticatedStateEffect(internalProviderState);
  useBackendFailureStateEffect(internalProviderState);
  useBackendInaccessibleStateEffect(internalProviderState);
  useBackgroundedStateEffect(internalProviderState);
  useNeedsRefreshStateEffect(internalProviderState);
  useRefreshingStateEffect(internalProviderState);
  useRestoringStateEffect(internalProviderState);
  useTokenRemovalState(internalProviderState);
};
