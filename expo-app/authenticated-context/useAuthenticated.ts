import { useContext } from "react";
import { IAuthenticated } from "./IAuthenticated";
import { AuthenticatedContext } from "./IAuthenticatedContext";

export function useAuthenticated(): IAuthenticated {
  return useContext(AuthenticatedContext);
}
