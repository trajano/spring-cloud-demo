import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { PropsWithChildren, ReactElement, useCallback, useEffect, useRef } from "react";
import { usePollingIf } from "../hooks/usePollingIf";
import { AuthClient } from "./AuthClient";
import { AuthContext } from "./AuthContext";
import { AuthenticationClientError } from "./AuthenticationClientError";
import { AuthEvent } from "./AuthEvent";
import { AuthState } from "./AuthState";
import { AuthStore } from "./AuthStore";
import { OAuthToken } from "./OAuthToken";

type AuthContextProviderProps = PropsWithChildren<{
    baseUrl: string,
    clientId: string,
    clientSecret: string,
    storagePrefix?: string,
}>;

export function AuthProvider({ baseUrl, clientId, clientSecret, children,
    storagePrefix = "auth." }: AuthContextProviderProps): ReactElement<AuthContextProviderProps> {
    const subscribersRef = useRef<((event: AuthEvent) => void)[]>([]);
    const storageRef = useRef(new AuthStore(storagePrefix));
    const authClientRef = useRef(new AuthClient(baseUrl, clientId, clientSecret));
    const authStateRef = useRef(AuthState.INITIAL);
    const oauthTokenRef = useRef<OAuthToken | null>(null);
    const netInfoState = useRef<Partial<NetInfoState>>({
        isConnected: false
    })

    function getAccessToken(): string | null {
        return oauthTokenRef.current?.access_token ?? null;
    }
    function getAuthorization() {
        return oauthTokenRef.current ? `Bearer ${oauthTokenRef.current.accessToken}` : null
    }

    const subscribe = useCallback(function subscribe(fn: (event: AuthEvent) => void) {
        subscribersRef.current.push(fn);
        return () => subscribersRef.current.filter(
            (subscription) => !Object.is(subscription, fn));
    }, []);

    const notify = useCallback(function notify(event: AuthEvent) {
        console.log({ event });
        subscribersRef.current.forEach((fn) => fn(event));
    }, []);

    async function login(authenticationCredentials: Record<string, unknown>) {

        try {
            const oauthToken = await authClientRef.current.authenticate(authenticationCredentials);
            const tokenExpiresAt = await storageRef.current.storeOAuthTokenAndGetExpiresAt(oauthToken);
            authStateRef.current = AuthState.AUTHENTICATED
            oauthTokenRef.current = oauthToken;
            notify({
                type: "Authenticated",
                accessToken: oauthToken.access_token,
                tokenExpiresAt
            })
        } catch (e: unknown) {
            if (e instanceof AuthenticationClientError) {
                await storageRef.current.clear();
            }
            throw e;
        }

    }

    /**
     * This will perform the logout.  Client failures are ignored since there's no point handling it.
     */
    async function logout() {

        try {
            const oauthToken = await storageRef.current.getOAuthToken();
            if (oauthToken == null) {
                return;
            }
            await authClientRef.current.logout(oauthToken.refresh_token)
        } catch (e: unknown) {
            if (!(e instanceof AuthenticationClientError)) {
                throw e;
            }
        } finally {
            await storageRef.current.clear();
            authStateRef.current = AuthState.UNAUTHENTICATED
            oauthTokenRef.current = null;
            notify({
                type: "Unauthenticated"
            })

        }
    }

    async function refresh() {
        notify({
            type: "CheckRefresh"
        })
        const oauthToken = await storageRef.current.getOAuthToken();
        if (oauthToken == null) {
            authStateRef.current = AuthState.UNAUTHENTICATED
            notify({
                type: "Unauthenticated",
                reason: "No token stored"
            })
        }
        else if (await storageRef.current.isExpiringInSeconds(60)) {
            notify({
                type: "Refreshing",
                reason: "Token is expiring in 60 seconds or has expired."
            })
            try {
                const refreshedOAuthToken = await authClientRef.current.refresh(oauthToken.refresh_token);
                const tokenExpiresAt = await storageRef.current.storeOAuthTokenAndGetExpiresAt(refreshedOAuthToken)
                authStateRef.current = AuthState.AUTHENTICATED
                oauthTokenRef.current = refreshedOAuthToken;
                notify({
                    type: "Authenticated",
                    accessToken: refreshedOAuthToken.access_token,
                    tokenExpiresAt
                })
            } catch (e: unknown) {
                if (e instanceof AuthenticationClientError) {
                    await storageRef.current.clear();
                    authStateRef.current = AuthState.UNAUTHENTICATED
                    oauthTokenRef.current = null;
                    notify({
                        type: "Unauthenticated",
                        reason: e.message
                    })
                } else {
                    throw e;
                }
            }
        } else {
            const tokenExpiresAt = await storageRef.current.getTokenExpiresAt()
            authStateRef.current = AuthState.AUTHENTICATED
            oauthTokenRef.current = oauthToken;

            notify({
                type: "Authenticated",
                accessToken: oauthToken.access_token,
                tokenExpiresAt
            })
        }
    }

    usePollingIf(() => authStateRef.current == AuthState.AUTHENTICATED && !!netInfoState.current.isInternetReachable, () => {
        refresh()
    }, 20000);
    useEffect(function restoreSession() {
        NetInfo.configure({
            reachabilityUrl: baseUrl + "/ping"
        })
        const unsubscribe = NetInfo.addEventListener(state => {
            netInfoState.current = state
        });
        refresh()
        return () => unsubscribe();
    }, [])
    return <AuthContext.Provider value={{
        getAuthState: () => authStateRef.current,
        getAuthorization,
        getAccessToken,
        getOauthToken: () => oauthTokenRef.current,
        subscribe,
        login,
        logout
    }}>{children}</AuthContext.Provider>
}
