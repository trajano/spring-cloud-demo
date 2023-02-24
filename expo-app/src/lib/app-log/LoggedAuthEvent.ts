import type { AppEvent } from "./AppEvent";

export type LoggedAuthEvent = AppEvent & {
  key: string;
  on: Date;
};
