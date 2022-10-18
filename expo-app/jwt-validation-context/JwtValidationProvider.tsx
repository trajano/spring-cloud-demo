import { PropsWithChildren, useCallback } from "react";
import { JwtValidationContext } from "./JwtValidationContext";
import { jwtVerify } from "./jwtVerify";

export function JwtValidationProvider({ baseUrl, clientId, children }: PropsWithChildren<{ baseUrl: string, clientId: string }>) {

    const verify = useCallback(async (accessToken: string) => jwtVerify(accessToken, new URL(`${baseUrl}/jwks`), clientId), [baseUrl, clientId])

    return (<JwtValidationContext.Provider value={{
        verify
    }}>
        {children}
    </JwtValidationContext.Provider>);
}