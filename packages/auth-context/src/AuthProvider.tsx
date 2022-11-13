import { isAfter } from "date-fns";
import React, { PropsWithChildren, ReactElement, useCallback, useMemo, useRef, useState } from "react";
import { AuthClient } from "./AuthClient";
import { AuthContext } from "./AuthContext";
import { AuthenticationClientError } from "./AuthenticationClientError";
import type { AuthEvent } from "./AuthEvent";
import { AuthState } from "./AuthState";
import { AuthStore } from "./AuthStore";
import type { OAuthToken } from "./OAuthToken";
import { useLastAuthEvents } from './useLastAuthEvents';
import { useRefreshOnAppEvent } from './useRefreshOnAppEvent';

type AuthContextProviderProps = PropsWithChildren<{
  baseUrl: string,
  clientId: string,
  clientSecret: string,
  /**
   * AsyncStorage prefix used to store the authentication data.
   */
  storagePrefix?: string,
  /**
   * Time in seconds to consider refreshing the access token.  Defaults to 10.
   */
  timeBeforeExpirationRefresh?: number
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
  timeBeforeExpirationRefresh = 10,
  storagePrefix = "auth."
}: AuthContextProviderProps): ReactElement<AuthContextProviderProps> {
  const subscribersRef = useRef<((event: AuthEvent) => void)[]>([]);
  const storageRef = useRef(new AuthStore(storagePrefix));
  const authClientRef = useRef(new AuthClient(baseUrl, clientId, clientSecret));
  const [authState, setAuthState] = useState(AuthState.INITIAL);
  const [oauthToken, setOauthToken] = useState<OAuthToken | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(new Date());
  // const [isConnected, setIsConnected] = useState(false);


  /**
   * Expiration timeout ID ref.  This is a timeout that executes when the OAuth timeout is less than X (default to 10) seconds away from expiration.
   * When it reaches the expiration it will set the state to NEEDS_REFRESH.
   * The timeout is cleared on unmount, logout or refresh.
   */
  // const expirationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [lastAuthEvents, pushAuthEvent] = useLastAuthEvents(logAuthEventFilterPredicate, logAuthEventSize);

  const accessToken = useMemo(() => oauthToken?.access_token ?? null, [oauthToken]);
  const authorization = useMemo(() => oauthToken ? `Bearer ${oauthToken.accessToken}` : null, [oauthToken]);
  // This next one is wrong, it needs to be updated when the timeout occurs
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

  // /**
  //  * This will set the auth state to needs refresh.  At this point the token has exceeded it's time limit.
  //  * There is no grace period check either.
  //  */
  // function expireToken() {
  //   setAuthState(AuthState.NEEDS_REFRESH);
  //   notify({
  //     type: "TokenExpiration",
  //     reason: "Timeout was reached"
  //   })
  // }

  // /**
  //  * This will set the auth state to needs refresh.  At this point the token has exceeded it's time limit.
  //  * There is no grace period check either.
  //  */
  // function expireTokenFn(s: string): () => void {
  //   return () => {
  //     setAuthState(AuthState.NEEDS_REFRESH);
  //     notify({
  //       type: "TokenExpiration",
  //       reason: "Timeout was reached " + s
  //     })
  //   }
  // }
  async function login(authenticationCredentials: Record<string, unknown>): Promise<void> {

    try {
      const nextOauthToken = await authClientRef.current.authenticate(authenticationCredentials);
      const nextTokenExpiresAt = await storageRef.current.storeOAuthTokenAndGetExpiresAt(nextOauthToken);
      setOauthToken(nextOauthToken)
      setTokenExpiresAt(nextTokenExpiresAt)
      setAuthState(AuthState.AUTHENTICATED)
      notify({
        type: "LoggedIn",
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.accessToken}`,
        tokenExpiresAt: nextTokenExpiresAt
      })
      notify({
        type: "Authenticated",
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.accessToken}`,
        tokenExpiresAt: nextTokenExpiresAt
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
      await doRefresh(storedOAuthToken, "from refresh()");
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
        setAuthState(AuthState.BACKEND_FAILURE)
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

  // /**
  //  * Periodically run the refresh logic.
  //  * @param reason reason
  //  */
  // async function periodicRefresh(reason?: string) {
  //   notify({
  //     type: "CheckRefresh",
  //     reason
  //   })
  //   const storedOAuthToken = await storageRef.current.getOAuthToken();
  //   if (storedOAuthToken == null) {
  //     setAuthState(AuthState.UNAUTHENTICATED)
  //     notify({
  //       type: "Unauthenticated",
  //       reason: "No token stored"
  //     })
  //   }
  //   else if (await storageRef.current.isExpiringInSeconds(timeBeforeExpirationRefresh) && !isConnected) {
  //     notify({
  //       type: "CheckRefresh",
  //       reason: `Token is expiring in ${timeBeforeExpirationRefresh} seconds or has expired.  But endpoint is not available.  Not changing state.`
  //     })
  //   } else if (await storageRef.current.isExpiringInSeconds(timeBeforeExpirationRefresh) && isConnected) {
  //     await doRefresh(storedOAuthToken, `Token is expiring in ${timeBeforeExpirationRefresh} seconds or has expired.  Endpoint is available.`);
  //   }
  // }

  // usePollingIf(() => (authState === AuthState.AUTHENTICATED || authState === AuthState.NEEDS_REFRESH) && isConnected, () => {
  //   periodicRefresh("Polling")
  // }, 20000);

  // function refreshOnActivate(state: AppStateStatus): void {
  //   if (state === "active" && isConnected) {
  //     periodicRefresh("App Activated")
  //   }
  // }

  // useEffect(function restoreSession() {
  //   NetInfo.configure({
  //     reachabilityUrl: baseUrl + "/ping",
  //     reachabilityTest: response => Promise.resolve(response.status === 200),
  //     useNativeReachability: true,
  //   })
  //   const subscription = AppState.addEventListener("change", refreshOnActivate);
  //   const unsubscribe = NetInfo.addEventListener(state => {
  //     setIsConnected(!!state.isInternetReachable);
  //     notify({
  //       type: "Connection",
  //       netInfoState: state,
  //     })
  //   });
  //   NetInfo.refresh().then(() => periodicRefresh("After NetInfo.refresh"));
  //   return () => {
  //     unsubscribe();
  //     subscription.remove();
  //     clearTimeout(expirationTimeoutRef.current);
  //   }
  // }, [])
  // useEffect(() => {
  //   console.log({ authState: AuthState[authState], isConnected })
  //   if (authState === AuthState.INITIAL && isConnected) {
  //     periodicRefresh("State is initial and connection has become available");
  //   }
  //   if (authState === AuthState.NEEDS_REFRESH && isConnected) {
  //     periodicRefresh("State is needs refresh and connection has become available");
  //   }
  // }, [authState, isConnected])

  const { tokenRefreshable: isConnected } = useRefreshOnAppEvent(
    baseUrl,
    notify,
    refresh,
    () => { setAuthState(AuthState.NEEDS_REFRESH); },
    timeBeforeExpirationRefresh,
    10,
    storageRef.current,
    authState);

  return <AuthContext.Provider value={{
    authState,
    authorization,
    accessToken,
    accessTokenExpired,
    accessTokenExpiresOn: tokenExpiresAt,
    oauthToken,
    isConnected,
    lastAuthEvents,
    subscribe,
    login,
    logout,
    refresh
  }}>{children}</AuthContext.Provider>
}
