import { createContext } from "react";

import { IAuthenticated } from "./IAuthenticated";
export const AuthenticatedContext = createContext<IAuthenticated>({
  internalState: [],
  username: "",
  verified: false,
  dbLoaded: false,
  whoami: () => Promise.resolve({}),
});
