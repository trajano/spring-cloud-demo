import { AuthEvent, useAuth } from "@trajano/spring-docker-auth-context";
import { useReducer } from "react";

import { LoggedAuthEvent } from "./LoggedAuthEvent";

export function useLastAuthEvents(
  logAuthEventFilterPredicate: (event: AuthEvent) => boolean,
  logAuthEventSize: number
) {
  const { initialAuthEvents } = useAuth();
  return useReducer(
    (
      current: LoggedAuthEvent[],
      nextAuthEvent: AuthEvent
    ): LoggedAuthEvent[] => {
      if (logAuthEventFilterPredicate(nextAuthEvent)) {
        return [
          {
            ...nextAuthEvent,
            key: nextAuthEvent.type + Date.now(),
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
