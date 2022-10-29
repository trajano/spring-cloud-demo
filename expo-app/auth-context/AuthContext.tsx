import { createContext } from "react";
import { AuthState } from "./AuthState";
import { IAuth } from "./IAuth";

export const AuthContext = createContext<IAuth>({
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    subscribe: () => { return () => { }; },
    accessToken: null,
    oauthToken: null,
    authorization: null,
    authState: AuthState.INITIAL,
    isConnected: false
});