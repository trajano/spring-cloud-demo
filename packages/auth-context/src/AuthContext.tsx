import { createContext } from "react";
import { AuthState } from "./AuthState";
import type { IAuth } from "./IAuth";

export const AuthContext = createContext<IAuth>({
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    refresh: () => Promise.resolve(),
    subscribe: () => { return () => { }; },
    accessToken: null,
    oauthToken: null,
    authorization: null,
    authState: AuthState.INITIAL,
    isConnected: false,
    lastUnauthenticatedEvents: []
});
