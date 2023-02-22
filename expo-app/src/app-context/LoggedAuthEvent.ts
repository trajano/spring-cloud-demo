import { AuthEvent } from "@trajano/spring-docker-auth-context";
import { AppEvent } from "./AppEvent";

export type LoggedAuthEvent = AppEvent & {
  key: string;
  on: Date;
};
