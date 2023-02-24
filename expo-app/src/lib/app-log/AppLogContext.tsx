/**
 * This context provides a unified app log capturing. It stores the most recent
 * entries in memory
 */
import noop from "lodash/noop";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
} from "react";

import { AppEvent } from "./AppEvent";
import { LoggedAuthEvent } from "./LoggedAuthEvent";

type ProviderProps = PropsWithChildren<{
  numberOfItemsInMemory?: number;
  logAuthEventFilterPredicate?: (event: AppEvent) => boolean;
}>;
interface ContextValue {
  loggedEvents: LoggedAuthEvent[];
  pushEvent: (e: AppEvent) => void;
  clearLog: () => void;
  /** Refreshes the logged events with the collected data */
  updateLog: () => void;
}

const defaultContextValue: ContextValue = {
  loggedEvents: [],
  updateLog: noop,
  pushEvent: noop,
  clearLog: noop,
};

const Context = createContext<ContextValue>(defaultContextValue);

export const AppLogProvider = ({
  numberOfItemsInMemory = 100,
  logAuthEventFilterPredicate = () => true,
  children,
}: ProviderProps) => {
  const [loggedEvents, setLoggedEvents] = useState<LoggedAuthEvent[]>([]);
  const loggedEventsRef = useRef<LoggedAuthEvent[]>([]);
  const pushEvent = useCallback(
    (nextAuthEvent: AppEvent) => {
      if (logAuthEventFilterPredicate(nextAuthEvent)) {
        loggedEventsRef.current = [
          {
            ...nextAuthEvent,
            key: `${nextAuthEvent.type}.${Date.now()}`,
            reason: `${nextAuthEvent.type} ${nextAuthEvent.reason ?? ""}`,
            on: new Date(),
          } as LoggedAuthEvent,
          ...loggedEventsRef.current,
        ].slice(0, numberOfItemsInMemory);
      }
    },
    [logAuthEventFilterPredicate, numberOfItemsInMemory]
  );
  const clearLog = useCallback(() => {
    loggedEventsRef.current = [];
  }, []);
  const updateLog = useCallback(() => {
    setLoggedEvents(loggedEventsRef.current);
  }, []);

  const contextValue = useMemo<ContextValue>(
    () => ({ loggedEvents, pushEvent, clearLog, updateLog }),
    [clearLog, , loggedEvents, pushEvent, updateLog]
  );
  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export const useAppLog = () => useContext(Context);
