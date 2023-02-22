import { AuthState } from "@trajano/spring-docker-auth-context";
import type { AuthEvent } from "@trajano/spring-docker-auth-context";

export type AppEvent =
  | AuthEvent
  | {
      type: "App";
      authState: AuthState;
      reason: string;
    };
