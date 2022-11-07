import { useContext } from "react";
import { IAuthenticated } from "./IAuthenticated";
import { AuthenticatedContext } from "./IAuthenticatedContext";

export function useJwtValidation(): IAuthenticated {
  return useContext(AuthenticatedContext);
}
