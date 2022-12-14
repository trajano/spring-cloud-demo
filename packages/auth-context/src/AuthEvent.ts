import type { NetInfoState } from '@react-native-community/netinfo';
/**
 * This gets fired when a valid authentication token was obtained after authentication or refresh.
 */
type AuthenticatedEvent = {
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
  /**
   * Reason for authentication if any
   */
  reason?: string;
};
/**
 * This gets fired when a valid authentication token was obtained after authentication.  This is
 * not fired when there is a refresh and is fired before {@link AuthenticatedEvent}
 */
type LoggedInEvent = {
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
  /**
   * Reason for authentication if any
   */
  reason?: string;
};
/**
 * This gets fired when the refresh process is about to start and it is being checked if needed or possible.
 */
type CheckRefreshEvent = {
  type: 'CheckRefresh';
  /**
   * Reason for refresh if any
   */
  reason?: string;
};

/**
 * This gets fired when the refresh process is started.  This occurs before the app client refresh is called.
 */
type RefreshingEvent = {
  type: 'Refreshing';
  /**
   * Reason for refresh if any
   */
  reason?: string;
};
/**
 * Connection change event.  This is explicity exported to allow better type safety.
 */
export type ConnectionChangeEvent = {
  type: 'Connection';
  /**
   * Current net info state.
   */
  netInfoState: NetInfoState;
  /**
   * Reason for refresh if any
   */
  reason?: string;
};
type TokenExpirationEvent = {
  type: 'TokenExpiration';
  /**
   * Reason for token expiration if any
   */
  reason?: string;
  /**
   * Body of response if available
   */
  responseBody?: string;
  /**
   * Net info state.
   */
  netInfoState?: NetInfoState
};
/**
 * This gets fired when there is a transition from authenticated to unauthenticated.  Or when the initial
 * state had determined that the user is not authenticated/
 */
type UnauthenticatedEvent = {
  type: 'Unauthenticated';
  /**
   * Reason why it is not authenticated if any.
   */
  reason?: string;
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
type LoggedOutEvent = {
  type: 'LoggedOut';
  /**
   * Reason for log off if any.
   */
  reason?: string;
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
export type LoggedAuthEvent = AuthEvent & {
  key: string;
  on: Date;
};
