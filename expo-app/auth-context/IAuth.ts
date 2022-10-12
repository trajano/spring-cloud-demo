import { AuthEvent } from "./AuthEvent";
import { AuthState } from "./AuthState";
import { OAuthToken } from "./OAuthToken";

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
  logout(): Promise<void>;
  /**
   * The OAuth token from the store if available.  May be null.  This is
   * not a state and will not trigger a re-render when updated.
   */
  getOauthToken(): OAuthToken | null;
  /**
   * Convenience to get the access token directly.  This is
   * not a state and will not trigger a re-render when updated.
   */
  getAccessToken(): string | null;
  /**
   * Convenience to get the Authorization header value.  This is
   * not a state and will not trigger a re-render when updated.
   */
  getAuthorization(): string | null;
  /**
   * Current authentication state.  This is
   * not a state and will not trigger a re-render when updated.
   */
  getAuthState(): AuthState;
}
