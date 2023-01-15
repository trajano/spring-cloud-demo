/**
 * Ensures that the value is a valid OAuth token.
 *
 * @param oauthToken Object to check
 * @returns True if valid.
 */
export function isValidOAuthToken(oauthToken?: any): boolean {
  return (
    !!oauthToken &&
    typeof oauthToken === 'object' &&
    typeof oauthToken.access_token === 'string' &&
    oauthToken.access_token !== '' &&
    typeof oauthToken.refresh_token === 'string' &&
    oauthToken.refresh_token !== '' &&
    typeof oauthToken.expires_in === 'number' &&
    oauthToken.token_type === 'Bearer'
  );
}
