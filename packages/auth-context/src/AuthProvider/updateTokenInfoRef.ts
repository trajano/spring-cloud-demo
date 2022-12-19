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
    (await authStorage.getOAuthToken()) ?? oauthTokenRef.current;
  tokenExpiresAtRef.current =
    (await authStorage.getTokenExpiresAt()) ?? tokenExpiresAtRef.current;
}
