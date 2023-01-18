import { AuthEvent, useAuth } from "@trajano/spring-docker-auth-context";
import { useEffect, useMemo } from "react";

import { AppContext } from "./AppContext";
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
  logAuthEventFilterPredicate = (event: AuthEvent) =>
    event.type !== "Connection" && event.type !== "CheckRefresh",
  logAuthEventSize = 50,
}: AppProviderProps): JSX.Element {
  const { subscribe } = useAuth();
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
  useEffect(() => subscribe(pushAuthEvent), [pushAuthEvent, subscribe]);
  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
