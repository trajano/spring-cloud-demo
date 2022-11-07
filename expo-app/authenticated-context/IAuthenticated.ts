import { JwtClaims } from "./JwtClaims";

export interface IAuthenticated {
  // some state goes here that's populated from the event stream
  internalState: string[],
  username: string,
  verified: boolean,
  claims?: JwtClaims
}
