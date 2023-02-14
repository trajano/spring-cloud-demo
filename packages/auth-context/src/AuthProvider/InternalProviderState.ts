import type { Dispatch } from 'react';

import type { AuthEvent } from '..';
import type { AuthClient } from '../AuthClient';
import type { AuthState } from '../AuthState';
import type { IAuthStore } from '../AuthStore/IAuthStore';
import type { OAuthToken } from '../OAuthToken';

export type InternalProviderState<T = unknown> = {
  /** If false, the app has been backgrounded. */
  appActive: boolean;
  authState: AuthState;
  authStorage: IAuthStore;
  backendReachable: boolean;
  authClient: AuthClient<T>;
  oauthToken: OAuthToken | null;
  /** When does the token expire */
  tokenExpiresAt: Date;
  /**
   * Time in milliseconds to consider refreshing the access token. Defaults to
   * 10 seconds.
   */
  timeBeforeExpirationRefresh: number;
  /**
   * Notifies subscribers. There's a specific handler if it is "Unauthenticated"
   * that the provider handles. These and other functions are not wrapped in
   * useCallback because when any of the state changes it will render these
   * anyway and we're not optimizing from the return value either.
   */
  notify: (event: AuthEvent) => void;
  setAuthState: Dispatch<AuthState>;
  setOAuthToken: Dispatch<OAuthToken | null>;
  setTokenExpiresAt: Dispatch<Date>;
};
