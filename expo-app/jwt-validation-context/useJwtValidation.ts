import { useContext } from "react";
import { IJwtValidation } from "./IJwtValidation";
import { JwtValidationContext } from "./JwtValidationContext";

export function useJwtValidation(): IJwtValidation {
  return useContext(JwtValidationContext);
}
