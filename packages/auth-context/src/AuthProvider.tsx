import NetInfo from '@react-native-community/netinfo';
import { usePollingIf } from "@trajano/react-hooks";
import React, { PropsWithChildren, ReactElement, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AppState, AppStateStatus } from 'react-native';
import { AuthClient } from "./AuthClient";
import { AuthContext } from "./AuthContext";
import { AuthenticationClientError } from "./AuthenticationClientError";
import type { AuthEvent } from "./AuthEvent";
import { AuthState } from "./AuthState";
import { AuthStore } from "./AuthStore";
import type { OAuthToken } from "./OAuthToken";

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
  const [isConnected, setIsConnected] = useState(false);
  const expirationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [lastUnauthenticatedEvents, pushUnauthenticatedEvent] = useReducer((current: AuthEvent[], unauthenticatedAuthEvent: AuthEvent) => {
    return [unauthenticatedAuthEvent, ...current];
  }, []);

  const accessToken = useMemo(() => oauthToken?.access_token ?? null, [oauthToken]);
  const authorization = useMemo(() => oauthToken ? `Bearer ${oauthToken.accessToken}` : null, [oauthToken]);

  const subscribe = useCallback(function subscribe(fn: (event: AuthEvent) => void) {
    subscribersRef.current.push(fn);
    return () => subscribersRef.current.filter(
      (subscription) => !Object.is(subscription, fn));
  }, []);

  /**
   * Notifies subscribers.  There's a specific handler if it is "Unauthenticated" that the provider handles.
   */
  const notify = useCallback(function notify(event: AuthEvent) {
    if (event.type === "Unauthenticated") {
      pushUnauthenticatedEvent(event);
    }
    subscribersRef.current.forEach((fn) => fn(event));
  }, []);

  function expireToken() {
    setAuthState(AuthState.NEEDS_REFRESH);
    notify({
      type: "TokenExpiration",
      reason: "Timeout was reached"
    })
  }
  async function login(authenticationCredentials: Record<string, unknown>) {

    try {
      const nextOauthToken = await authClientRef.current.authenticate(authenticationCredentials);
      const tokenExpiresAt = await storageRef.current.storeOAuthTokenAndGetExpiresAt(nextOauthToken);
      setAuthState(AuthState.AUTHENTICATED)
      setOauthToken(nextOauthToken)
      expirationTimeoutRef.current = setTimeout(expireToken, Date.now() - tokenExpiresAt.getTime());
      notify({
        type: "LoggedIn",
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.accessToken}`,
        tokenExpiresAt
      })
      notify({
        type: "Authenticated",
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.accessToken}`,
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
      await authClientRef.current.revoke(oauthToken.refresh_token)
    } catch (e: unknown) {
      if (!(e instanceof AuthenticationClientError)) {
        throw e;
      }
    } finally {
      await storageRef.current.clear();
      setAuthState(AuthState.UNAUTHENTICATED)
      setOauthToken(null);
      clearTimeout(expirationTimeoutRef.current);
      notify({
        type: "LoggedOut"
      })
      notify({
        type: "Unauthenticated",
        reason: "Logged out"
      })

    }
  }

  async function refresh() {
    const storedOAuthToken = await storageRef.current.getOAuthToken();
    if (storedOAuthToken == null) {
      setAuthState(AuthState.UNAUTHENTICATED)
      notify({
        type: "Unauthenticated",
        reason: "No token stored"
      })
    } else {
      doRefresh(storedOAuthToken, "Forced refresh");
    }
  }
  async function doRefresh(storedOAuthToken: OAuthToken, reason?: string) {
    notify({
      type: "Refreshing",
      reason
    })
    try {
      const refreshedOAuthToken = await authClientRef.current.refresh(storedOAuthToken.refresh_token);
      const tokenExpiresAt = await storageRef.current.storeOAuthTokenAndGetExpiresAt(refreshedOAuthToken)
      setAuthState(AuthState.AUTHENTICATED)
      setOauthToken(refreshedOAuthToken);
      clearTimeout(expirationTimeoutRef.current);
      expirationTimeoutRef.current = setTimeout(expireToken, Date.now() - tokenExpiresAt.getTime());
      notify({
        type: "Authenticated",
        accessToken: refreshedOAuthToken.access_token,
        authorization: `Bearer ${refreshedOAuthToken.accessToken}`,
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

  }

  async function periodicRefresh(reason?: string) {
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
    else if (await storageRef.current.isExpiringInSeconds(60) && !isConnected) {
      notify({
        type: "CheckRefresh",
        reason: "Token is expiring in 60 seconds or has expired.  But endpoint is not available.  Not changing state."
      })
    } else if (await storageRef.current.isExpiringInSeconds(60) && isConnected) {
      await doRefresh(storedOAuthToken, "Token is expiring in 60 seconds or has expired.  Endpoint is available.");
    } else {
      const tokenExpiresAt = await storageRef.current.getTokenExpiresAt()
      setAuthState(AuthState.AUTHENTICATED)
      setOauthToken(storedOAuthToken);
      notify({
        type: "Authenticated",
        accessToken: storedOAuthToken.access_token,
        authorization: `Bearer ${storedOAuthToken.accessToken}`,
        tokenExpiresAt
      })
    }
  }

  usePollingIf(() => authState == AuthState.AUTHENTICATED && isConnected, () => {
    periodicRefresh("Polling")
  }, 20000);
  useEffect(function restoreSession() {
    NetInfo.configure({
      reachabilityUrl: baseUrl + "/ping",
      reachabilityTest: response => Promise.resolve(response.status === 200),
      useNativeReachability: true,
    })
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isInternetReachable);
      notify({
        type: "Connection",
        netInfoState: state,
      })
    });
    NetInfo.refresh().then(() => periodicRefresh("After NetInfo.refresh"));
    return () => unsubscribe();
  }, [authState])
  useEffect(() => {
    if (authState === AuthState.INITIAL && isConnected) {
      periodicRefresh("State is initial and connection has become available");
    }
  }, [authState, isConnected])

  function refreshOnActivate(state: AppStateStatus): void {
    if (state === "active" && isConnected) {
      periodicRefresh("App Activated")
    }
  }
  useEffect(() => {
    // attach application state listener
    const subscription = AppState.addEventListener("change", refreshOnActivate);
    return () => subscription.remove();
  }, []);
  return <AuthContext.Provider value={{
    authState,
    authorization,
    accessToken,
    oauthToken,
    isConnected,
    lastUnauthenticatedEvents,
    subscribe,
    login,
    logout,
    refresh
  }}>{children}</AuthContext.Provider>
}
