import type { AuthEvent } from './AuthEvent';
import type { AuthState } from './AuthState';
import type { EndpointConfiguration } from './EndpointConfiguration';
import type { OAuthToken } from './OAuthToken';

export interface IAuth<A = unknown> {
  /**
   * The OAuth token from the store if available. May be null.
   *
   * Note this should only be used for setting the initial state and not be used
   * for any other purpose. The value obtained from a subscription should be
   * used as it gets updated as soon as a new token is obtained.
   *
   * The token will be provided as long as it is present. It does not check
   * whether it is expired or not.
   */
  oauthToken: OAuthToken | null;
  /**
   * The access token. May be null if the token is not obtained.
   *
   * Note this should only be used for setting the initial state and not be used
   * for any other purpose. The value obtained from a subscription should be
   * used as it gets updated as soon as a new token is obtained.
   *
   * The token will be provided as long as it is present. It does not check
   * whether it is expired or not.
   */
  accessToken: string | null;
  /**
   * This indicates that the access token is expired and should not be
   * verifiable.
   *
   * This will return true if it is within the `timeBeforeExpirationRefresh`
   * period so the token is still valid but should really be refreshed as soon
   * as possible.
   *
   * This returns true if the access token is not available.
   */
  accessTokenExpired: boolean;
  /**
   * Indicates that the app data is loaded from any data store. This is true
   * when there's no token.
   */
  appDataLoaded: boolean;
  /**
   * This specifies when the access token will expire. This may return an
   * arbitrary time value in the past if the access token or expiration is not
   * available.
   */
  tokenExpiresAt: Date;
  /**
   * Convenience to get the Authorization header value. Unlike accessToken, this
   * becomes `null` when the token is deemed to be expired already.
   *
   * Note this should only be used for setting the initial state and not be used
   * for any other purpose. The value obtained from a subscription should be
   * used as it gets updated as soon as a new token is obtained.
   */
  authorization: string | null;
  /**
   * Current authentication state. This is a React state and triggers a
   * re-render when updated.
   */
  authState: AuthState;
  /**
   * Base URL as a string.
   * https://github.com/facebook/react-native/blob/main/Libraries/Blob/URL.js
   * does not implement all of the URL spec so it's best to avoid it for now.
   */
  baseUrl: string;
  /** Current endpoint configuration. */
  endpointConfiguration: EndpointConfiguration;
  /**
   * Determine if the backend is reachable. If not ideally no client calls
   * should be made. This has no bearing on the current authentication state so
   * it can be used on login screens to determine whether to show the login
   * button.
   */
  backendReachable: boolean;
  /** When the last check for authentication state using timer effect was done. */
  lastCheckAt: Date;

  /**
   * Force check of the auth storage data. This is primarily used for testing
   * purposes as the data is not normally modified outside the context.
   */
  forceCheckAuthStorageAsync: () => Promise<void>;

  /**
   * @param fn Callback function that receives events
   * @returns Function to unsubscribe
   */
  subscribe: (fn: (event: AuthEvent) => void) => () => void;

  /**
   * This performs the call to the authentication server with the credentials
   * provided. If the authentication was successful it provide the API response
   * for further processing. If there's a failure a AuthenticationClientError
   * will be thrown.
   *
   * @param authenticationCredentials
   * @returns The fetch API response
   * @throws AuthenticationClientError
   */
  loginAsync: (authenticationCredentials: A) => Promise<Response>;

  /**
   * Revokes the token. Will fail if the user is not authenticated.
   *
   * @param forced If true, then auth state is not checked and the tokens are
   *   forcibly removed. Defaults to false.
   * @param postLogoutCallback This is invoked after the logout has been
   *   processed.
   */
  logoutAsync: (
    forced?: boolean,
    postLogoutCallback?: () => void
  ) => Promise<void>;

  /**
   * Refreshes the token outside of the schedule. This is done by invalidatign
   * the token by adjusting the storage value such that the token is expired and
   * updating the token expiration state.
   */
  refreshAsync: () => Promise<void>;

  /**
   * Sets the endpoint configuration for the context. This allows switching
   * between backends.
   *
   * @param next Next endpoint configuration.
   */
  setEndpointConfiguration: (next: EndpointConfiguration) => void;
  /**
   * Signals the provider that the app data was loaded during the
   * {@link AuthState.RESTORING} state.
   */
  signalAppDataLoaded: () => void;
  /**
   * Signals the provider that the token was processed during the
   * {@link AuthState.USABLE_TOKEN} state.
   */
  signalTokenProcessed: () => void;
  /**
   * Signals the provider that all initialization is done for the provider
   * (namely calls to {@link IAuth.subscribe}) before the token is determined to
   * exist and leave {@link AuthState.INITIAL} state.
   */
  signalStart: () => void;
}
