import type { OAuthToken } from '../OAuthToken';

/**
 * Interface representing the auth data storage.  The interface allows for an altnerate storage implementation to be used.
 */
export interface IAuthStore {
  /**
   * Obtains the access token provide if it is available and not expired.  This will return null if the token is expired.
   * This is exposed so if we have to do "background fetch".
   * @returns access token if available `null` otherwise.
   */
  getAccessTokenAsync(): Promise<string | null>;
  /**
   * Obtains the full OAuth token provide if it is available.  This does not check expiration.
   * @returns token if available `null` otherwise.
   */
  getOAuthTokenAsync(): Promise<OAuthToken | null>;
  /**
   *
   * @param oauthToken OAuth token to store.  This token will be validated for structure and will throw an error if it is not valid.
   * @returns when the token will expire
   */
  storeOAuthTokenAndGetExpiresAtAsync(oauthToken: OAuthToken): Promise<Date>;
  /**
   * Obtains the instant when the token will expire.  This will never return null, but may return epoch time.
   */
  getTokenExpiresAtAsync(): Promise<Date>;
  /**
   * Clears the token data.
   */
  clearAsync(): Promise<void>;
}
