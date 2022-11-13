export enum AuthState {
    INITIAL,
    /**
     * Authenticated means that the token is valid.
     */
    AUTHENTICATED,
    UNAUTHENTICATED,
    /**
     * In this state, the token was authenticated at one point but now needs to be refreshed.
     * The access token is still available, but it is not guaranteed to be verified successfully.
     */
    NEEDS_REFRESH,
}
