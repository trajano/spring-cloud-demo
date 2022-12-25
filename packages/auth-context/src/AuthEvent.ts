import type { NetInfoState } from '@react-native-community/netinfo';
import type { AuthState } from './AuthState';
type CommonAuthEvent = {
  type: string;
  authState: AuthState;
  /**
   * Reason for event if any
   */
  reason?: string;
};
/**
 * This gets fired when a valid authentication token was obtained after authentication or refresh.
 * Exported so it can be used in a test.
 */
export type AuthenticatedEvent = CommonAuthEvent & {
  type: 'Authenticated';
  /**
   * The raw access token.
   */
  accessToken: string;
  /**
   * A value suitable for Authorization HTTP header.
   */
  authorization: string;
  tokenExpiresAt: Date;
};
/**
 * This gets fired when a valid authentication token was obtained after authentication.  This is
 * not fired when there is a refresh and is fired before {@link AuthenticatedEvent}
 */
type LoggedInEvent = CommonAuthEvent & {
  type: 'LoggedIn';
  /**
   * The raw access token.
   */
  accessToken: string;
  /**
   * A value suitable for Authorization HTTP header.
   */
  authorization: string;
  tokenExpiresAt: Date;
};
/**
 * This gets fired when the refresh process is about to start and it is being checked if needed or possible.
 */
type CheckRefreshEvent = CommonAuthEvent & {
  type: 'CheckRefresh';
  lastCheckTime?: Date;
  tokenRefreshable?: boolean;
  tokenExpired?: boolean;
  tokenExpiresAt?: Date | null;
  backendReachable?: boolean;
};

/**
 * This gets fired when the refresh process is started.  This occurs before the app client refresh is called.
 */
type RefreshingEvent = CommonAuthEvent & {
  type: 'Refreshing';
};
/**
 * Connection change event.  This is explicity exported to allow better type safety.
 */
export type ConnectionChangeEvent = CommonAuthEvent & {
  type: 'Connection';
  /**
   * Current net info state.
   */
  netInfoState: NetInfoState;
};
type TokenExpirationEvent = CommonAuthEvent & {
  type: 'TokenExpiration';
  /**
   * Body of response if available
   */
  responseBody?: string;
  /**
   * Net info state.
   */
  netInfoState?: NetInfoState;
};
/**
 * This gets fired when there is a transition from authenticated to unauthenticated.  Or when the initial
 * state had determined that the user is not authenticated/
 */
type UnauthenticatedEvent = CommonAuthEvent & {
  type: 'Unauthenticated';
  /**
   * Body of response if available
   */
  responseBody?: string;
};
/**
 * This gets fired when there was an explicit logoff event.  This is fired before {@link UnauthenticatedEvent}.
 * A use case for handling this event is to remove any notification or background fetch handlers from the app and also to
 * deregister the notification token on a remote server.
 */
type LoggedOutEvent = CommonAuthEvent & {
  type: 'LoggedOut';
};
export type AuthEvent =
  | AuthenticatedEvent
  | CheckRefreshEvent
  | ConnectionChangeEvent
  | LoggedInEvent
  | LoggedOutEvent
  | RefreshingEvent
  | TokenExpirationEvent
  | UnauthenticatedEvent;
