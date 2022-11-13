import NetInfo from '@react-native-community/netinfo';
import { usePollingIf } from "@trajano/react-hooks";
import React, { PropsWithChildren, ReactElement, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { isAfter } from "date-fns";
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
  /**
   * AsyncStorage prefix used to store the authentication data.
   */
  storagePrefix?: string,
  /**
   * Predicate to determine whether to log the event.  Defaults to accept all except `Connection` and `CheckRefresh` which are polling events.
   */
  logAuthEventFilterPredicate?: (event: AuthEvent) => boolean;
  /**
   * Size of the auth event log.  Defaults to 50
   */
  logAuthEventSize?: number;
}>;

export function AuthProvider({ baseUrl,
  clientId,
  clientSecret,
  children,
  logAuthEventFilterPredicate = (event: AuthEvent) => event.type !== "Connection" && event.type !== "CheckRefresh",
  logAuthEventSize = 50,
  storagePrefix = "auth."
}: AuthContextProviderProps): ReactElement<AuthContextProviderProps> {
  const subscribersRef = useRef<((event: AuthEvent) => void)[]>([]);
  const storageRef = useRef(new AuthStore(storagePrefix));
  const authClientRef = useRef(new AuthClient(baseUrl, clientId, clientSecret));
  const [authState, setAuthState] = useState(AuthState.INITIAL);
  const [oauthToken, setOauthToken] = useState<OAuthToken | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const expirationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [lastAuthEvents, pushAuthEvent] = useReducer((current: AuthEvent[], nextAuthEvent: AuthEvent) => {
    if (logAuthEventFilterPredicate(nextAuthEvent)) {
      return [nextAuthEvent, ...current].slice(0, logAuthEventSize);
    } else {
      return current;
    }
  }, []);

  const accessToken = useMemo(() => oauthToken?.access_token ?? null, [oauthToken]);
  const authorization = useMemo(() => oauthToken ? `Bearer ${oauthToken.accessToken}` : null, [oauthToken]);
  const accessTokenExpired = useMemo(() => {
    if (!oauthToken) {
      return true;
    } else {
      return isAfter(Date.now(), tokenExpiresAt);
    }
  }, [oauthToken, tokenExpiresAt]);

  const subscribe = useCallback(function subscribe(fn: (event: AuthEvent) => void) {
    subscribersRef.current.push(fn);
    return () => subscribersRef.current.filter(
      (subscription) => !Object.is(subscription, fn));
  }, []);

  /**
   * Notifies subscribers.  There's a specific handler if it is "Unauthenticated" that the provider handles.
   */
  const notify = useCallback(function notify(event: AuthEvent) {
    pushAuthEvent(event);
    subscribersRef.current.forEach((fn) => fn(event));
  }, []);

  /**
   * This will set the auth state to needs refresh.  At this point the token has exceeded it's time limit.
   * There is no grace period check either.
   */
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
      const nextTokenExpiresAt = await storageRef.current.storeOAuthTokenAndGetExpiresAt(refreshedOAuthToken)
      setAuthState(AuthState.AUTHENTICATED)
      setOauthToken(refreshedOAuthToken);
      setTokenExpiresAt(nextTokenExpiresAt);
      clearTimeout(expirationTimeoutRef.current);
      expirationTimeoutRef.current = setTimeout(expireToken, Date.now() - nextTokenExpiresAt.getTime());
      notify({
        type: "Authenticated",
        reason: "Refreshed",
        accessToken: refreshedOAuthToken.access_token,
        authorization: `Bearer ${refreshedOAuthToken.accessToken}`,
        tokenExpiresAt: nextTokenExpiresAt
      })
    } catch (e: unknown) {
      if (e instanceof AuthenticationClientError && e.isUnauthorized()) {
        await storageRef.current.clear();
        setAuthState(AuthState.UNAUTHENTICATED)
        setOauthToken(null);
        notify({
          type: "Unauthenticated",
          reason: e.message,
          responseBody: await e.response.json()
        })
      } else if (e instanceof AuthenticationClientError && !e.isUnauthorized()) {
        // at this point there is an error but it's not something caused by the user so don't clear off the token
        setAuthState(AuthState.NEEDS_REFRESH)
        notify({
          type: "TokenExpiration",
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
        reason: reason,
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
    accessTokenExpired,
    oauthToken,
    isConnected,
    lastAuthEvents,
    subscribe,
    login,
    logout,
    refresh
  }}>{children}</AuthContext.Provider>
}
