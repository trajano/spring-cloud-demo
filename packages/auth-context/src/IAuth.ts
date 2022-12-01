import type { AuthEvent, LoggedAuthEvent } from './AuthEvent';
import type { AuthState } from './AuthState';
import type { OAuthToken } from './OAuthToken';

export interface IAuth {
  /**
   *
   * @param fn callback function that receives events
   * @returns function to unsubscribe
   */
  subscribe(fn: (event: AuthEvent) => void): () => void;
  /**
   *
   * @param authenticationCredentials
   * @returns nothing
   */
  login(authenticationCredentials: Record<string, unknown>): Promise<void>;
  /**
   * Refreshes the token outside of the schedule.
   */
  refresh(): Promise<void>;
  logout(): Promise<void>;
  /**
   * The OAuth token from the store if available.  May be null.
   *
   * Note this should only be used for setting the initial state
   * and not be used for any other purpose.  The value obtained from
   * a subscription should be used as it gets updated as soon
   * as a new token is obtained.
   *
   * The token will be provided as long as it is present.  It
   * does not check whether it is expired or not.   */
  oauthToken: OAuthToken | null;
  /**
   * The access token.  May be null if the token is not obtained.
   *
   * Note this should only be used for setting the initial state
   * and not be used for any other purpose.  The value obtained from
   * a subscription should be used as it gets updated as soon
   * as a new token is obtained.
   *
   * The token will be provided as long as it is present.  It
   * does not check whether it is expired or not.
   */
  accessToken: string | null;
  /**
   * This indicates that the access token is expired and should not
   * be verifiable.
   *
   * This returns true if the access token is not available.
   */
  accessTokenExpired: boolean;
  /**
   * This specifies when the access token will expire.  This may
   * return `Date(0)` if the access token is not available.
   */
  accessTokenExpiresOn: Date;
  /**
   * Convenience to get the Authorization header value.  Unlike
   * accessToken, this becomes `null` when the token is deemed
   * to be expired already.
   *
   * Note this should only be used for setting the initial state
   * and not be used for any other purpose.  The value obtained from
   * a subscription should be used as it gets updated as soon
   * as a new token is obtained.
   */
  authorization: string | null;
  /**
   * Current authentication state.  This is
   * not a React state and will not trigger a re-render when updated.
   */
  authState: AuthState;
  /**
   * Base URL as a URL.
   */
  baseUrl: URL;
  /**
   * Sets the base URL for the context.  This allows switching between backends.
   * @param nextBaseUrl next base URL. It will be converted to URL if it is a string.
   */
  setBaseUrl(nextBaseUrl: string | URL): void;
  /**
   * Determine if the backend is reachable.
   */
  isConnected: boolean;
  /**
   * Last auth events.  The most recent one will be the first element.
   * This is primarily used to diagnose issues where the token becomes invalidated
   * and the user was forcefully logged out.
   */
  lastAuthEvents: LoggedAuthEvent[];
}
