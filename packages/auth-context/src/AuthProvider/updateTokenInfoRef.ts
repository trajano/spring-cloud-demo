import type { MutableRefObject } from 'react';
import type { AuthStore } from '../AuthStore';
import type { OAuthToken } from '../OAuthToken';

/**
 * This updates the token info refs.
 */
export async function updateTokenInfoRef(
  authStorage: AuthStore,
  oauthTokenRef: MutableRefObject<OAuthToken | null>,
  tokenExpiresAtRef: MutableRefObject<Date | null>
): Promise<void> {
  oauthTokenRef.current =
    (await authStorage.getOAuthTokenAsync()) ?? oauthTokenRef.current;
  tokenExpiresAtRef.current =
    (await authStorage.getTokenExpiresAtAsync()) ?? tokenExpiresAtRef.current;
}
