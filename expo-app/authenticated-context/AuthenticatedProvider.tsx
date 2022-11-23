import { useAsyncSetEffect, useMounted } from "@trajano/react-hooks";
import { useAuth } from "@trajano/spring-docker-auth-context";
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Alert } from "react-native";
import EventSource from "react-native-sse";
import { AuthenticatedContext } from "./IAuthenticatedContext";
import { JwtClaims } from "./JwtClaims";
import { jwtVerify } from "./jwtVerify";
import '@reduxjs/toolkit';
// import { legacy_createStore as createStore } from "redux";
// export const store = createStore((state = 0, action) => state);

// let store;
// try {
//     const { configureStore } = require("@reduxjs/toolkit");
//     store = configureStore({
//         reducer: {},
//     });
// } catch (error) {
//     alert(`Caught error: ${error}`);
// }
// console.log(store);

// At present this has a problem on restore in that the access token is not valid yet.
type AuthenticatedProviderProps = PropsWithChildren<{
    clientId: string,
    issuer: string
}>;
export function AuthenticatedProvider({ clientId, issuer, children }: AuthenticatedProviderProps) {

    const { baseUrl, accessToken } = useAuth();
    const [claims, setClaims] = useState<JwtClaims>();
    const isMounted = useMounted();
    const username = useMemo(() => claims?.sub ?? "", [claims]);
    const verified = useMemo(() => !!claims, [claims]);

    const eventStream = useRef<EventSource<string>>();

    const [internalState, updateInternalStateFromServerSentEvent] = useReducer((state: string[], nextEvent: string) => { return [...state, nextEvent].slice(-5) }, [])
    useAsyncSetEffect(async function verifyToken() {
        // when access token changes the value could fail.
        // when the internet is broken then the verification will fail 
        // maybe use a reducer here?
        try {
            return jwtVerify(accessToken, new URL("/jwks", baseUrl.href), issuer, clientId);
        } catch (e) {
            return Promise.resolve(undefined);
        }
    },
        (nextClaims) => {
            setClaims(nextClaims);
        }, [accessToken]);

    useEffect(() => {
        // this should be refactored to it's own file to provide the data stream
        // log.warn({ verified, username })
        if (verified && username) {

            eventStream.current = new EventSource<string>(new URL("/grpc/Echo/echoStream", baseUrl.href), {
                headers: {
                    authorization: `Bearer ${accessToken}`,
                    "content-type": "application/json",
                    accept: "text/event-stream"
                },
                method: "POST",
                body: JSON.stringify({ message: `I am ${username}` })
            });
            eventStream.current.addEventListener("message", (event) => {
                if (event.type === "message" && event.data && isMounted()) {
                    updateInternalStateFromServerSentEvent(event.data);
                }
            })
            return () => eventStream.current?.close();
        }

    }, [verified, username, accessToken])

    async function whoami() {
        console.log({ whoami: accessToken })
        const r = await fetch(new URL("/whoami/", baseUrl.href), {
            headers: {
                authorization: `Bearer ${accessToken}`,
                "content-type": "application/json",
                accept: "application/json",
            },
            method: "GET",
            credentials: "include"
        });
        return r.json();

    }

    return (<AuthenticatedContext.Provider value={{
        internalState,
        username,
        verified,
        whoami,
        claims
    }}>
        {children}
    </AuthenticatedContext.Provider>);
}