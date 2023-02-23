import { useReducer } from "react";

import { AppEvent } from "./AppEvent";
import { LoggedAuthEvent } from "./LoggedAuthEvent";

export function useLastAuthEvents(
  logAuthEventFilterPredicate: (event: AppEvent) => boolean,
  logAuthEventSize: number
) {
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
            reason: `${nextAuthEvent.type} ${nextAuthEvent.reason ?? ""}`,
            on: new Date(),
          } as LoggedAuthEvent,
          ...current,
        ].slice(0, logAuthEventSize);
      } else {
        return current;
      }
    },
    []
  );
}
