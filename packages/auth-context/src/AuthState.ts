export enum AuthState {
  INITIAL,
  /**
   * Authenticated means that the token is valid.
   */
  AUTHENTICATED,
  /**
   * Unauthenticated means that there is no token information at all.
   */
  UNAUTHENTICATED,
  /**
   * In this state, the refresh is running at the moment.
   */
  REFRESHING,
  /**
   * In this state, the token was authenticated at one point but now needs to be refreshed.
   * The access token is still available, but it is not guaranteed to be work successfully.
   */
  NEEDS_REFRESH,
  /**
   * In this state, the token was authenticated at one point but now needs to be refreshed.
   * The access token is still available, but it is not guaranteed to be work successfully.
   * However, the backend is actually down so a retry is needed.
   */
  BACKEND_FAILURE,
}
