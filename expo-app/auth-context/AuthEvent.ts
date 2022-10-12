/**
 * This gets fired when a valid authentication token was obtained after authentication or refresh.
 */
type AuthenticatedEvent = {
    type: "Authenticated",
    accessToken: string,
    tokenExpiresAt: Date,
};
/**
 * This gets fired when the refresh process is started
 */
type RefreshingEvent = {
    type: "Refreshing",
};
/**
 * This gets fired when there is a transition from authenticated to unauthenticated.  Or when the initial 
 * state had determined that the user is not authenticated/
 */
 type UnauthenticatedEvent = {
    type: "Unauthenticated",
};
export type AuthEvent = AuthenticatedEvent | RefreshingEvent | UnauthenticatedEvent;
