import type { AuthEvent, LoggedAuthEvent } from './AuthEvent';
import type { AuthState } from './AuthState';
import type { EndpointConfiguration } from './EndpointConfiguration';
import type { OAuthToken } from './OAuthToken';

export interface IAuth<A = any> {
  /**
   *
   * @param fn callback function that receives events
   * @returns function to unsubscribe
   */
  subscribe(fn: (event: AuthEvent) => void): () => void;
  /**
   * This performs the call to the authentication server with the credentials provided.
   * If the authentication was successful it provide the API response for further processing.
   * If there's a failure a AuthenticationClientError will be thrown.
   *
   * @param authenticationCredentials
   * @returns the fetch API response
   * @throws AuthenticationClientError
   */
  login(authenticationCredentials: A): Promise<Response>;
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
   * This will return true if it is within the
   * `timeBeforeExpirationRefresh` period so the token is still valid
   * but should really be refreshed as soon as possible.
   *
   * This returns true if the access token is not available.
   */
  accessTokenExpired: boolean;
  /**
   * This specifies when the access token will expire.  This may
   * return an arbitrary time value in the past if the access token
   * or expiration is not available.
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
   * Current endpoint configuration.
   */
  endpointConfiguration: EndpointConfiguration;
  /**
   * Sets the endpoint configuration for the context.  This allows switching between backends.
   * @param next next endpoint configuration.
   */
  setEndpointConfiguration(next: EndpointConfiguration): void;
  /**
   * Determine if the backend is reachable.
   */
  tokenRefreshable: boolean;
  /**
   * Last auth events.  The most recent one will be the first element.
   * This is primarily used to diagnose issues where the token becomes invalidated
   * and the user was forcefully logged out.
   */
  lastAuthEvents: LoggedAuthEvent[];
}
