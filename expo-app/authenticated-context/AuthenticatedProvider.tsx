import { useAsyncSetEffect, useMounted } from "@trajano/react-hooks";
import { PropsWithChildren, useRef, useEffect, useMemo, useReducer, useState } from "react";
import { AuthenticatedContext } from "./IAuthenticatedContext";
import { JwtClaims } from "./JwtClaims";
import { jwtVerify } from "./jwtVerify";
import EventSource from "react-native-sse";

export function AuthenticatedProvider({ baseUrl, accessToken, clientId, children }: PropsWithChildren<{ baseUrl: string, accessToken: string, clientId: string }>) {

    const [claims, setClaims] = useState<JwtClaims>();
    const isMounted = useMounted();
    const username = useMemo(() => claims?.sub ?? "", [claims]);
    const verified = useMemo(() => !!claims, [claims]);

    const eventStream = useRef<EventSource<string>>();

    const [internalState, updateInternalStateFromServerSentEvent] = useReducer((state: string[], nextEvent: string) => { return [...state, nextEvent].slice(-5) }, [])
    useAsyncSetEffect(async function verifyToken() {
        try {
            return jwtVerify(accessToken, new URL(`${baseUrl}/jwks`), clientId);
        } catch (e) {
            return Promise.resolve(undefined);
        }
    },
        (nextClaims) => {
            setClaims(nextClaims);
        }, []);
    useEffect(() => {

        if (verified && username) {
            eventStream.current = new EventSource<string>(`${baseUrl}/grpc/Echo/echoStream`, {
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

    }, [verified, username])

    return (<AuthenticatedContext.Provider value={{
        internalState,
        username,
        verified,
        claims
    }}>
        {children}
    </AuthenticatedContext.Provider>);
}