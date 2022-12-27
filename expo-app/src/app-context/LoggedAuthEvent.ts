import { AuthEvent } from "@trajano/spring-docker-auth-context";

export type LoggedAuthEvent = AuthEvent & {
  key: string;
  on: Date;
};
