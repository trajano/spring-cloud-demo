import type { PropsWithChildren } from 'react';

import type { IAuthStore } from '../AuthStore';
import type { EndpointConfiguration } from '../EndpointConfiguration';

export type AuthProviderProps = PropsWithChildren<{
  /** Default endpoint configuration */
  defaultEndpointConfiguration: EndpointConfiguration;
  /**
   * AsyncStorage prefix used to store the authentication data. Applicable only
   * to the default auth store.
   */
  storagePrefix?: string;
  /**
   * Time in milliseconds to consider refreshing the access token. Defaults to
   * 10 seconds.
   */
  timeBeforeExpirationRefresh?: number;
  /** Alternative auth storage. */
  authStorage?: IAuthStore;
  onRefreshError?: (reason: unknown) => void;
  /**
   * If true (false default), it will wait for {@link IAuth.signalStart} to be
   * called before starts going to {@link AuthState.INITIAL} state.
   *
   * This is used to allow children to register authentication handlers before
   * entering {@link AuthState.INITIAL} state.
   */
  waitForSignalToStart?: boolean;
  /**
   * If true (false default), it will wait for
   * {@link WaitForDataLoadedEvent.signalDataLoaded} to be called before it
   * acknowledges that the token is present.
   *
   * This is used to allow children to register authentication handlers before
   * leaving {@link AuthState.INITIAL} state.
   */
  waitForSignalWhenDataIsLoaded?: boolean;
}>;
