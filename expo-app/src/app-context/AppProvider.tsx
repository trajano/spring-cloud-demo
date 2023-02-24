import {
  AuthEvent,
  AuthState,
  useAuth,
} from "@trajano/spring-docker-auth-context";
import { useCallback, useEffect, useMemo } from "react";

import { AppContext } from "./AppContext";
import { AppProviderProps } from "./AppProviderProps";
import { IAppContext } from "./IAppContext";
import { useAppLog } from "../lib/app-log";
import { AppEvent } from "../lib/app-log/AppEvent";

/**
 * Provides the context to the React application.
 *
 * @param props Provider initalization props
 * @returns Context provider.
 */
export function AppProvider({
  children,
  logAuthEventFilterPredicate = (event: AppEvent) =>
    event.type !== "Connection" && event.type !== "CheckRefresh",
}: AppProviderProps): JSX.Element {
  const {
    loggedEvents,
    pushEvent,
    clearLog: clearLastAuthEvents,
  } = useAppLog();
  const { authState, subscribe, signalStart } = useAuth();
  /** Context value. Memoized. */
  useEffect(
    () =>
      subscribe(({ type, authState, ...rest }: AuthEvent) => {
        console.log(`${type} ${AuthState[authState]} ${JSON.stringify(rest)}`);
      }),
    [subscribe]
  );
  const pushAuthEventAsync = useCallback(
    (event: AppEvent) => {
      pushEvent(event);
    },
    // async (event: AppEvent) => {
    //   console.log("HERE")
    //   return (Promise.resolve(() => { console.log("THERE") ; pushEvent(event) }));
    // },
    [pushEvent]
  );
  useEffect(
    () => subscribe((event) => pushAuthEventAsync(event)),
    [pushAuthEventAsync, subscribe]
  );
  useEffect(
    () =>
      subscribe((event: AuthEvent) => {
        if (event.type === "WaitForDataLoaded") {
          // pushAuthEventAsync({ type: "App", reason: "Data loaded", authState })
          //   .then(() => { event.signalDataLoaded(); })
          //   .catch(console.error)
          event.signalDataLoaded();
        }
      }),
    [subscribe, authState, pushAuthEventAsync]
  );
  useEffect(
    () =>
      subscribe((event: AuthEvent) => {
        if (event.type === "UsableToken") {
          event.signalTokenProcessed();
          // pushAuthEventAsync({ type: "App", reason: "Usable token event", authState })
          //   .then(() => { event.signalTokenProcessed(); })
          //   .catch(console.error);
        }
      }),
    [subscribe, authState, pushAuthEventAsync]
  );
  useEffect(() => {
    signalStart();
  }, [signalStart]);

  const contextValue = useMemo<IAppContext>(
    () => ({ lastAuthEvents: loggedEvents, clearLastAuthEvents }),
    [loggedEvents, clearLastAuthEvents]
  );
  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
