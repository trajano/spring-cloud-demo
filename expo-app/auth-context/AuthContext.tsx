import { createContext } from "react";
import { AuthState } from "./AuthState";
import { IAuth } from "./IAuth";

export const AuthContext = createContext<IAuth>({
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    subscribe: () => { return () => { }; },
    getAccessToken: () => null,
    oauthToken: null,
    getAuthorization: () => null,
    getAuthState: () => AuthState.INITIAL,
});