export enum AuthState {
    INITIAL,
    AUTHENTICATED,
    UNAUTHENTICATED,
    /**
     * In this state, the token was authenticated at one point but now needs to be refreshed.
     */
    NEEDS_REFRESH,
}
