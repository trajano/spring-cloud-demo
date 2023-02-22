import {
  AuthEvent,
  useAuth,
  AuthState,
} from "@trajano/spring-docker-auth-context";
import { useEffect, useMemo } from "react";

import { AppContext } from "./AppContext";
import { AppEvent } from "./AppEvent";
import { AppProviderProps } from "./AppProviderProps";
import { IAppContext } from "./IAppContext";
import { useLastAuthEvents } from "./useLastAuthEvents";

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
  logAuthEventSize = 50,
}: AppProviderProps): JSX.Element {
  const { authState, subscribe, signalStart } = useAuth();
  /**
   * Last auth events. Eventually this will be removed and placed with the app
   * rather than the context. Kept for debugging.
   */
  const [lastAuthEvents, pushAuthEvent] = useLastAuthEvents(
    logAuthEventFilterPredicate,
    logAuthEventSize
  );
  /** Context value. Memoized. */
  const contextValue = useMemo<IAppContext>(
    () => ({ lastAuthEvents }),
    [lastAuthEvents]
  );
  useEffect(() => {
    console.log("Register log handler...");
    return subscribe(({ type, authState, ...rest }: AuthEvent) => {
      console.log(`${type} ${AuthState[authState]} ${JSON.stringify(rest)}`);
    });
  }, [subscribe]);
  useEffect(() => subscribe(pushAuthEvent), [pushAuthEvent, subscribe]);
  useEffect(() => {
    console.log("Register loaded effect...");
    return subscribe((event: AuthEvent) => {
      if (event.type === "WaitForDataLoaded") {
        pushAuthEvent({ type: "App", reason: "Data loaded", authState });
        console.log("Data loaded");
        event.signalDataLoaded();
      }
    });
  }, [subscribe, authState, pushAuthEvent]);
  useEffect(() => {
    console.log("Starting...");
    signalStart();
  }, [signalStart]);
  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
