import { useDeepState } from "@trajano/react-hooks";
import { isAfter } from "date-fns";
import React, { PropsWithChildren, ReactElement, useCallback, useMemo, useRef } from "react";
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

type TokenState = {
  authState: AuthState,
  oauthToken: OAuthToken | null,
  tokenExpiresAt: Date
}
export function AuthProvider({ baseUrl: baseUrlString,
  clientId,
  clientSecret,
  children,
  logAuthEventFilterPredicate = (event: AuthEvent) => event.type !== "Connection" && event.type !== "CheckRefresh",
  logAuthEventSize = 50,
  timeBeforeExpirationRefresh = 10,
  storagePrefix = "auth."
}: AuthContextProviderProps): ReactElement<AuthContextProviderProps> {
  const baseUrl = useMemo(() => new URL(baseUrlString), [baseUrlString]);
  const subscribersRef = useRef<((event: AuthEvent) => void)[]>([]);
  const storageRef = useRef(new AuthStore(storagePrefix));
  const authClientRef = useRef(new AuthClient(baseUrl, clientId, clientSecret));

  const [tokenState, setTokenState] = useDeepState<TokenState>({
    authState: AuthState.INITIAL,
    oauthToken: null,
    tokenExpiresAt: new Date(0)
  });

  /**
   * Expiration timeout ID ref.  This is a timeout that executes when the OAuth timeout is less than X (default to 10) seconds away from expiration.
   * When it reaches the expiration it will set the state to NEEDS_REFRESH.
   * The timeout is cleared on unmount, logout or refresh.
   */
  // const expirationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [lastAuthEvents, pushAuthEvent] = useLastAuthEvents(logAuthEventFilterPredicate, logAuthEventSize);

  const accessToken = useMemo(() => tokenState.oauthToken?.access_token ?? null, [tokenState.oauthToken]);
  // This next one is wrong, it needs to be updated when the timeout occurs
  const accessTokenExpired = useMemo(() => {
    if (!tokenState.oauthToken) {
      return true;
    } else {
      return isAfter(Date.now(), tokenState.tokenExpiresAt);
    }
  }, [tokenState.oauthToken, tokenState.tokenExpiresAt]);
  const authorization = useMemo(() => (!accessTokenExpired && tokenState.oauthToken) ? `Bearer ${tokenState.oauthToken.accessToken}` : null, [tokenState.oauthToken, accessTokenExpired]);

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

  async function login(authenticationCredentials: Record<string, unknown>): Promise<void> {

    try {
      const nextOauthToken = await authClientRef.current.authenticate(authenticationCredentials);
      const nextTokenExpiresAt = await storageRef.current.storeOAuthTokenAndGetExpiresAt(nextOauthToken);
      setTokenState({
        authState: AuthState.AUTHENTICATED,
        oauthToken: nextOauthToken,
        tokenExpiresAt: nextTokenExpiresAt
      })
      notify({
        type: "LoggedIn",
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.access_token}`,
        tokenExpiresAt: nextTokenExpiresAt
      })
      notify({
        type: "Authenticated",
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.access_token}`,
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
      if (tokenState.oauthToken == null) {
        return;
      }
      await authClientRef.current.revoke(tokenState.oauthToken.refresh_token)
    } catch (e: unknown) {
      if (!(e instanceof AuthenticationClientError)) {
        throw e;
      }
    } finally {
      await storageRef.current.clear();
      setTokenState({
        authState: AuthState.UNAUTHENTICATED,
        oauthToken: null,
        tokenExpiresAt: new Date(0)
      });
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
    setTokenState({
      authState: AuthState.REFRESHING,
      oauthToken: tokenState.oauthToken,
      tokenExpiresAt: tokenState.tokenExpiresAt
    });
    const storedOAuthToken = await storageRef.current.getOAuthToken();
    if (storedOAuthToken == null) {
      setTokenState({
        authState: AuthState.UNAUTHENTICATED,
        oauthToken: null,
        tokenExpiresAt: new Date(0)
      });
      notify({
        type: "Unauthenticated",
        reason: "No token stored"
      })
    } else if (!isConnected) {
      // refresh was attempted when the backend is not available
      setTokenState({
        authState: AuthState.BACKEND_FAILURE,
        oauthToken: tokenState.oauthToken,
        tokenExpiresAt: tokenState.tokenExpiresAt
      });
      notify({
        type: "TokenExpiration",
        reason: "Backend is not available and token refresh was requested"
      })
    } else {
      notify({
        type: "Refreshing",
      })
      try {
        const refreshedOAuthToken = await authClientRef.current.refresh(storedOAuthToken.refresh_token);
        const nextTokenExpiresAt = await storageRef.current.storeOAuthTokenAndGetExpiresAt(refreshedOAuthToken)
        setTokenState({
          authState: AuthState.AUTHENTICATED,
          oauthToken: refreshedOAuthToken,
          tokenExpiresAt: nextTokenExpiresAt
        })
        notify({
          type: "Authenticated",
          reason: "Refreshed",
          accessToken: refreshedOAuthToken.access_token,
          authorization: `Bearer ${refreshedOAuthToken.access_token}`,
          tokenExpiresAt: nextTokenExpiresAt
        })
      } catch (e: unknown) {
        if (e instanceof AuthenticationClientError && e.isUnauthorized()) {
          await storageRef.current.clear();
          setTokenState({
            authState: AuthState.UNAUTHENTICATED,
            oauthToken: null,
            tokenExpiresAt: new Date(0)
          });
          notify({
            type: "Unauthenticated",
            reason: e.message,
            responseBody: await e.response.json()
          })
        } else if (e instanceof AuthenticationClientError && !e.isUnauthorized()) {
          // at this point there is an error but it's not something caused by the user so don't clear off the token
          setTokenState({
            authState: AuthState.BACKEND_FAILURE,
            oauthToken: tokenState.oauthToken,
            tokenExpiresAt: tokenState.tokenExpiresAt
          });
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
  }

  const { tokenRefreshable: isConnected } = useRefreshOnAppEvent(
    baseUrl,
    notify,
    refresh,
    () => {
      setTokenState({
        authState: AuthState.NEEDS_REFRESH,
        oauthToken: tokenState.oauthToken,
        tokenExpiresAt: tokenState.tokenExpiresAt
      });
    },
    timeBeforeExpirationRefresh,
    10,
    storageRef.current,
    tokenState.authState);

  return <AuthContext.Provider value={{
    authState: tokenState.authState,
    authorization,
    accessToken,
    accessTokenExpired,
    accessTokenExpiresOn: tokenState.tokenExpiresAt,
    baseUrl,
    oauthToken: tokenState.oauthToken,
    isConnected,
    lastAuthEvents,
    subscribe,
    login,
    logout,
    refresh
  }}>{children}</AuthContext.Provider>
}
