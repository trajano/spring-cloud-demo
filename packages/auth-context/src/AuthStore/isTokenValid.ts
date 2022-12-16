import type { OAuthToken } from '../OAuthToken';

export function isTokenValid(oauthToken: OAuthToken): boolean {
  return (
    !!oauthToken &&
    typeof oauthToken === 'object' &&
    typeof oauthToken.access_token === 'string' &&
    oauthToken.access_token !== "" &&
    typeof oauthToken.refresh_token === 'string' &&
    oauthToken.refresh_token !== "" &&
    typeof oauthToken.expires_in === 'number' &&
    oauthToken.token_type === 'Bearer'
  );
}
