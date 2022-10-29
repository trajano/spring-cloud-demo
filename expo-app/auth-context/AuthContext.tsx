import { NetInfoStateType } from "@react-native-community/netinfo";
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
    authState: AuthState.INITIAL,
    netInfoState: {
        isConnected: false,
        type: NetInfoStateType.unknown,
        isInternetReachable: null,
        details: null
    },
    isConnected: () => false
});