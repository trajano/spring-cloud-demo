import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { usePollingIf } from "@trajano/react-hooks";
import { PropsWithChildren, ReactElement, useCallback, useEffect, useRef, useState } from "react";
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
    const [authState, setAuthState] = useState(AuthState.INITIAL);
    const [oauthToken, setOauthToken] = useState<OAuthToken | null>(null);
    const netInfoState = useRef<NetInfoState>({
        isConnected: false,
        type: NetInfoStateType.unknown,
        isInternetReachable: null,
        details: null
    });

    function getAccessToken(): string | null {
        return oauthToken?.access_token ?? null;
    }
    function getAuthorization() {
        return oauthToken ? `Bearer ${oauthToken.accessToken}` : null
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
            const nextOauthToken = await authClientRef.current.authenticate(authenticationCredentials);
            const tokenExpiresAt = await storageRef.current.storeOAuthTokenAndGetExpiresAt(nextOauthToken);
            setAuthState(AuthState.AUTHENTICATED)
            setOauthToken(nextOauthToken)
            notify({
                type: "Authenticated",
                accessToken: nextOauthToken.access_token,
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
            setAuthState(AuthState.UNAUTHENTICATED)
            setOauthToken(null);
            notify({
                type: "Unauthenticated"
            })

        }
    }

    async function refresh(reason?: string) {
        notify({
            type: "CheckRefresh",
            reason
        })
        const storedOAuthToken = await storageRef.current.getOAuthToken();
        if (storedOAuthToken == null) {
            setAuthState(AuthState.UNAUTHENTICATED)
            notify({
                type: "Unauthenticated",
                reason: "No token stored"
            })
        }
        else if (await storageRef.current.isExpiringInSeconds(60) && !netInfoState.current.isInternetReachable) {
            notify({
                type: "CheckRefresh",
                reason: "Token is expiring in 60 seconds or has expired.  But endpoint is not available.  Not changing state."
            })
        } else if (await storageRef.current.isExpiringInSeconds(60) && netInfoState.current.isInternetReachable) {
            notify({
                type: "Refreshing",
                reason: "Token is expiring in 60 seconds or has expired.  Endpoint is available."
            })
            try {
                const refreshedOAuthToken = await authClientRef.current.refresh(storedOAuthToken.refresh_token);
                const tokenExpiresAt = await storageRef.current.storeOAuthTokenAndGetExpiresAt(refreshedOAuthToken)
                setAuthState(AuthState.AUTHENTICATED)
                setOauthToken(refreshedOAuthToken);
                notify({
                    type: "Authenticated",
                    accessToken: refreshedOAuthToken.access_token,
                    tokenExpiresAt
                })
            } catch (e: unknown) {
                if (e instanceof AuthenticationClientError) {
                    await storageRef.current.clear();
                    setAuthState(AuthState.UNAUTHENTICATED)
                    setOauthToken(null);
                    notify({
                        type: "Unauthenticated",
                        reason: e.message,
                        responseBody: await e.response.json()
                    })
                } else {
                    throw e;
                }
            }
        } else {
            const tokenExpiresAt = await storageRef.current.getTokenExpiresAt()
            setAuthState(AuthState.AUTHENTICATED)
            setOauthToken(storedOAuthToken);
            notify({
                type: "Authenticated",
                accessToken: storedOAuthToken.access_token,
                tokenExpiresAt
            })
        }
    }

    usePollingIf(() => authState == AuthState.AUTHENTICATED && !!netInfoState.current.isInternetReachable, () => {
        refresh("Polling")
    }, 20000);
    useEffect(function restoreSession() {
        NetInfo.configure({
            reachabilityUrl: baseUrl + "/ping",
            reachabilityTest: response => Promise.resolve(response.status === 200),
            useNativeReachability: true,
        })
        const unsubscribe = NetInfo.addEventListener(state => {
            netInfoState.current = state
            notify({
                type: "Connection",
                netInfoState: state,
            })
            if (authState === AuthState.INITIAL && netInfoState.current.isInternetReachable) {
                refresh("State is initial and connection has become available");
            }
        });
        NetInfo.refresh().then(() => refresh("After NetInfo.refresh"));
        return () => unsubscribe();
    }, [])
    return <AuthContext.Provider value={{
        authState,
        getAuthorization,
        getAccessToken,
        oauthToken,
        getNetInfoState: () => netInfoState.current,
        isConnected: () => !!netInfoState.current.isInternetReachable,
        subscribe,
        login,
        logout
    }}>{children}</AuthContext.Provider>
}
