import { useAuthenticatedStateEffect } from './useAuthenticatedStateEffect';
import { useBackendFailureStateEffect } from './useBackendFailureStateEffect';
import { useBackendInaccessibleStateEffect } from './useBackendInaccessibleStateEffect';
import { useDispatchingStateEffect } from './useDispatchingStateEffect';
import { useRefreshingStateEffect } from './useRefreshingStateEffect';
import { useRestoringStateEffect } from './useRestoringStateEffect';
import { useTokenRemovalState } from './useTokenRemovalState';
import { useUsableTokenStateEffect } from './useUsableTokenStateEffect';
import type { InternalProviderState } from '../InternalProviderState';

export const useTokenAvailableEffect = (
  internalProviderState: InternalProviderState
) => {
  useAuthenticatedStateEffect(internalProviderState);
  useBackendFailureStateEffect(internalProviderState);
  useBackendInaccessibleStateEffect(internalProviderState);
  useDispatchingStateEffect(internalProviderState);
  useRefreshingStateEffect(internalProviderState);
  useRestoringStateEffect(internalProviderState);
  useTokenRemovalState(internalProviderState);
  useUsableTokenStateEffect(internalProviderState);
};
