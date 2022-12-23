import { useReducer } from "react";
import type { AuthEvent } from "@trajano/spring-docker-auth-context";
import { LoggedAuthEvent } from "./LoggedAuthEvent";

export function useLastAuthEvents(
  logAuthEventFilterPredicate: (event: AuthEvent) => boolean,
  logAuthEventSize: number
) {
  return useReducer(function lastAuthEventsReducer(
    current: LoggedAuthEvent[],
    nextAuthEvent: AuthEvent
  ): LoggedAuthEvent[] {
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
  []);
}
