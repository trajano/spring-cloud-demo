import {
  useAsyncSetEffect,
  useDeepState,
  useMounted,
} from "@trajano/react-hooks";
import { useAuth } from "@trajano/spring-docker-auth-context";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import EventSource from "react-native-sse";

import { IAuthenticated } from "./IAuthenticated";
import { AuthenticatedContext } from "./IAuthenticatedContext";
import { JwtClaims } from "./JwtClaims";
import { jwtVerify } from "./jwtVerify";
import { useDb } from "./useDb";
/*
 * import '@reduxjs/toolkit';
 * import { legacy_createStore as createStore } from "redux";
 * export const store = createStore((state = 0, action) => state);
 */

/*
 * let store;
 * try {
 *     const { configureStore } = require("@reduxjs/toolkit");
 *     store = configureStore({
 *         reducer: {},
 *     });
 * } catch (error) {
 *     alert(`Caught error: ${error}`);
 * }
 * console.log(store);
 */

// At present this has a problem on restore in that the access token is not valid yet.
type AuthenticatedProviderProps = PropsWithChildren<{
  clientId: string;
  issuer: string;
  verifyClaims?: boolean;
  whoAmIEndpoint?: string;
}>;
export function AuthenticatedProvider({
  clientId,
  issuer,
  whoAmIEndpoint = "whoami/",
  verifyClaims = true,
  children,
}: AuthenticatedProviderProps) {
  const { baseUrl, accessToken, authorization } = useAuth();
  const [claims, setClaims] = useDeepState<JwtClaims | undefined>();
  const isMounted = useMounted();
  const username = useMemo(() => claims?.sub ?? "", [claims]);
  const verified = useMemo(() => !!claims, [claims]);

  const eventStream = useRef<EventSource<string>>();

  const { loaded: dbLoaded, db } = useDb("mydb");

  const [internalState, updateInternalStateFromServerSentEvent] = useReducer(
    (state: string[], nextEvent: string) => [...state, nextEvent].slice(-5),
    []
  );
  const verifyToken = useCallback(async () => {
    if (!verifyClaims) {
      return undefined;
    }
    /*
     * when access token changes the value could fail.
     * when the internet is broken then the verification will fail
     * maybe use a reducer here?
     */
    try {
      return await jwtVerify(accessToken, `${baseUrl}jwks`, issuer, clientId);
    } catch (_e: unknown) {
      return Promise.resolve(undefined);
    }
  }, [verifyClaims, jwtVerify, accessToken, baseUrl, issuer, clientId]);

  useAsyncSetEffect(verifyToken, setClaims, []);

  useEffect(() => {
    /*
     * this should be refactored to it's own file to provide the data stream
     * log.warn({ verified, username })
     */
    if (verified && username) {
      eventStream.current = new EventSource<string>(
        new URL("/grpc/Echo/echoStream", baseUrl),
        {
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
            accept: "text/event-stream",
          },
          method: "POST",
          body: JSON.stringify({ message: `I am ${username}` }),
        }
      );
      eventStream.current.addEventListener("message", (event) => {
        if (event.type === "message" && event.data && isMounted()) {
          updateInternalStateFromServerSentEvent(event.data);
        }
      });
      return () => eventStream.current?.close();
    }
  }, [verified, username, accessToken]);

  const whoami = useCallback(async () => {
    console.log({ whoamiCall: accessToken?.slice(-5) });
    const r = await fetch(baseUrl + whoAmIEndpoint, {
      headers: {
        authorization: authorization!,
        "content-type": "application/json",
        accept: "application/json",
      },
      method: "GET",
      credentials: "omit",
    });
    return r.json();
  }, [accessToken, authorization]);

  const contextValue = useMemo<IAuthenticated>(
    () => ({
      internalState,
      username,
      verified,
      whoami,
      claims,
      dbLoaded,
      db,
    }),
    [internalState, username, verified, whoami, claims, dbLoaded, db]
  );
  return (
    <AuthenticatedContext.Provider value={contextValue}>
      {children}
    </AuthenticatedContext.Provider>
  );
}
