import { useAsyncSetEffect, useMounted } from "@trajano/react-hooks";
import { PropsWithChildren, useRef, useEffect, useMemo, useReducer, useState } from "react";
import { AuthenticatedContext } from "./IAuthenticatedContext";
import { JwtClaims } from "./JwtClaims";
import { jwtVerify } from "./jwtVerify";
import EventSource from "react-native-sse";
import { logger } from "react-native-logs";

// At present this has a problem on restore in that the access token is not valid yet.

export function AuthenticatedProvider({ baseUrl, accessToken, clientId, issuer, children }: PropsWithChildren<{ baseUrl: string, accessToken: string, clientId: string, issuer: string }>) {

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
            return jwtVerify(accessToken, new URL(`${baseUrl}/jwks`), issuer, clientId);
        } catch (e) {
            return Promise.resolve(undefined);
        }
    },
        (nextClaims) => {
            setClaims(nextClaims);
        }, [accessToken]);

    const log = logger.createLogger()
    // log.debug({ verified, username, accessToken });

    useEffect(() => {
        // this should be refactored to it's own file to provide the data stream
        // log.warn({ verified, username })
        if (verified && username) {

            // this can fail if there's no connection.
            fetch(`${baseUrl}/whoami`, {
                headers: {
                    authorization: `Bearer ${accessToken}`,
                    "content-type": "application/json",
                    accept: "application/json",
                },
                method: "GET",
            }).then(w => console.log(w.body)).catch((e) => console.log(e));
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

    }, [verified, username, accessToken])

    return (<AuthenticatedContext.Provider value={{
        internalState,
        username,
        verified,
        claims
    }}>
        {children}
    </AuthenticatedContext.Provider>);
}