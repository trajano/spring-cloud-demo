import { useAuth } from "@trajano/spring-docker-auth-context";
import { useReducer } from "react";

import { AppEvent } from "./AppEvent";
import { LoggedAuthEvent } from "./LoggedAuthEvent";

export function useLastAuthEvents(
  logAuthEventFilterPredicate: (event: AppEvent) => boolean,
  logAuthEventSize: number
) {
  const { initialAuthEvents } = useAuth();
  return useReducer(
    (
      current: LoggedAuthEvent[],
      nextAuthEvent: AppEvent
    ): LoggedAuthEvent[] => {
      if (logAuthEventFilterPredicate(nextAuthEvent)) {
        return [
          {
            ...nextAuthEvent,
            key: `${nextAuthEvent.type}.${Date.now()}`,
            on: new Date(),
          },
          ...current,
        ].slice(0, logAuthEventSize);
      } else {
        return current;
      }
    },
    initialAuthEvents.map((event, index) => ({
      ...event,
      key: `initial.${index}`,
      on: new Date(),
    }))
  );
}
