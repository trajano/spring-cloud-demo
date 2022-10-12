import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { IAuth } from "./IAuth";

export function useAuth(): IAuth {
  return useContext(AuthContext);
}
