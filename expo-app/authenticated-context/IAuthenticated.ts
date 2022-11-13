import { JwtClaims } from "./JwtClaims";

export interface IAuthenticated {
  /**
   * Some state goes here that's populated from the event stream.
   * This may be a type parameter later.
   */
  internalState: string[];
  username: string;
  verified: boolean;
  claims?: JwtClaims;
  /**
   * This invokes the whoami endpoint
   */
  whoami(): Promise<Record<string, unknown>>;
}
