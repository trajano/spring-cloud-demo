import noop from 'lodash/noop';

import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';

export const useUsableTokenStateEffect = ({
  authState,
  oauthToken,
  notify,
  setAuthState,
  signalTokenProcessed,
  tokenExpiresAt,
  tokenProcessed,
  waitForSignalWhenNewTokenIsProcessed,
}: InternalProviderState) => {
  if (authState !== AuthState.USABLE_TOKEN) {
    return noop;
  }
  if (!waitForSignalWhenNewTokenIsProcessed && oauthToken) {
    notify({
      type: 'Authenticated',
      authState,
      reason: 'automatically transitioning from UsableToken state',
      accessToken: oauthToken.access_token,
      authorization: `Bearer ${oauthToken.access_token}`,
      tokenExpiresAt,
    });
    setAuthState(AuthState.AUTHENTICATED);
  } else if (
    waitForSignalWhenNewTokenIsProcessed &&
    !tokenProcessed &&
    oauthToken
  ) {
    notify({
      type: 'UsableToken',
      authState,
      reason: 'Usable token',
      accessToken: oauthToken.access_token,
      authorization: `Bearer ${oauthToken.access_token}`,
      tokenExpiresAt,
      signalTokenProcessed,
    });
  } else if (
    waitForSignalWhenNewTokenIsProcessed &&
    tokenProcessed &&
    oauthToken
  ) {
    notify({
      type: 'Authenticated',
      authState,
      reason: 'token processed signal received',
      accessToken: oauthToken.access_token,
      authorization: `Bearer ${oauthToken.access_token}`,
      tokenExpiresAt,
    });
    setAuthState(AuthState.AUTHENTICATED);
  }
  return noop;
};
