import type { Dispatch } from 'react';

import type { AuthEvent } from '..';
import type { AuthClient } from '../AuthClient';
import type { AuthState } from '../AuthState';
import type { IAuthStore } from '../AuthStore/IAuthStore';
import type { OAuthToken } from '../OAuthToken';

export type InternalProviderState<T = unknown> = {
  /** If false, the app has been backgrounded. */
  appActive: boolean;
  /**
   * Uf true, then the application data has already been loaded during the
   * {@link AuthState.RESTORING} state
   */
  appDataLoaded: boolean;
  authState: AuthState;
  authStorage: IAuthStore;
  backendReachable: boolean;
  authClient: AuthClient<T>;
  oauthToken: OAuthToken | null;
  /** If true, the machine should start up now. */
  signaled: boolean;
  /** When does the token expire */
  tokenExpiresAt: Date;
  tokenProcessed: boolean;
  /**
   * Time in milliseconds to consider refreshing the access token. Defaults to
   * 10 seconds.
   */
  timeBeforeExpirationRefresh: number;
  /**
   * Maximum number of ms before the check is fired again. Should not be larger
   * than 60 seconds.
   */
  maxTimeoutForRefreshCheckMs: number;

  /** Indicates that restoring from data needs a signal before moving to FSM */
  waitForSignalWhenDataIsLoaded: boolean;
  /**
   * Indicates that a new token needs a signal to indicate process complete
   * before moving to FSM
   */
  waitForSignalWhenNewTokenIsProcessed: boolean;

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
  signalAppDataLoaded: () => void;
  signalTokenProcessed: () => void;
  resetAppDataLoaded: () => void;
  resetTokenProcessed: () => void;
};
