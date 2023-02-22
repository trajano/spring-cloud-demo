import { AuthEvent } from "@trajano/spring-docker-auth-context";

export type AppEvent =
  | AuthEvent
  | {
      type: "App";
      reason: string,
      description: string;
    };
