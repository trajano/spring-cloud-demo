/** @module */
import type { PropsWithChildren } from "react";

import { AppEvent } from "../lib/app-log/AppEvent";
/** Provider initialization props */
export type AppProviderProps = PropsWithChildren<{
  /**
   * Predicate to determine whether to log the event. Defaults to accept all
   * except `Connection` and `CheckRefresh` which are polling events.
   */
  logAuthEventFilterPredicate?: (event: AppEvent) => boolean;
  /** Size of the auth event log. Defaults to 50 */
  logAuthEventSize?: number;
}>;
