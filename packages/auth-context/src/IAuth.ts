import type { AuthEvent } from "./AuthEvent";
import type { AuthState } from "./AuthState";
import type { OAuthToken } from "./OAuthToken";

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
   */
  oauthToken: OAuthToken | null;
  /**
   * The access token.  May be null.
   *
   * Note this should only be used for setting the initial state
   * and not be used for any other purpose.  The value obtained from
   * a subscription should be used as it gets updated as soon
   * as a new token is obtained.
   */
  accessToken: string | null;
  /**
   * Convenience to get the Authorization header value.
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
   * Determine if the backend is reachable.
   */
  isConnected: boolean;
}
