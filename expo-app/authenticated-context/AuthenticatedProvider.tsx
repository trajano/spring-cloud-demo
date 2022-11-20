import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useAsyncSetEffect, useMounted } from "@trajano/react-hooks";
import { useAuth } from "@trajano/spring-docker-auth-context";
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from "react";
import EventSource from "react-native-sse";
import { Provider } from "react-redux";
import { AuthenticatedContext } from "./IAuthenticatedContext";
import { JwtClaims } from "./JwtClaims";
import { jwtVerify } from "./jwtVerify";
import * as reducers from "./reducers";
import { persistStore, persistReducer } from 'redux-persist'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistGate } from 'redux-persist/integration/react';
import { AUTHENTICATED, SSE_EVENT } from './actions';

// At present this has a problem on restore in that the access token is not valid yet.
type AuthenticatedProviderProps = PropsWithChildren<{
    clientId: string,
    issuer: string
}>;
/**
 * This provider manages elements that are associated with the current login.  Including the Redux store.
 * @param param0 
 * @returns 
 */
export function AuthenticatedProvider({ clientId, issuer, children }: AuthenticatedProviderProps) {

    const { baseUrl, accessToken } = useAuth();
    const [claims, setClaims] = useState<JwtClaims>();
    const isMounted = useMounted();
    const username = useMemo(() => claims?.sub ?? "", [claims]);
    const verified = useMemo(() => !!claims, [claims]);

    const eventStream = useRef<EventSource<string>>();

    const [internalState, setInternalState] = useState([]);

    const persistConfig = useMemo(() => ({ key: verified ? username : "unknown", storage: AsyncStorage }), [username]);
    const persistedReducer = useMemo(() => persistReducer(persistConfig, combineReducers(reducers)), [persistConfig, reducers]);
    const store = useMemo(() => configureStore({
        reducer: persistedReducer,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false })
    }), [persistedReducer]);
    const persistor = useMemo(() => persistStore(store), [store]);

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
                    store.dispatch({ type: SSE_EVENT, payload: event.data })
                }
            })
            return () => eventStream.current?.close();
        }

    }, [verified, username, accessToken])

    async function whoami() {
        console.log({ whoami: accessToken })
        const r = await fetch(new URL("/whoami/", baseUrl.href), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "content-type": "application/json",
                accept: "application/json",
            },
            method: "GET",
            credentials: "include"
        });
        return r.json();

    }

    useEffect(() => {
        store.dispatch({ type: AUTHENTICATED, payload: claims });
        return store.subscribe(() => {
            setInternalState(store.getState().sseState)
        })
    }, [claims]);

    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' && module.hot) {
            module.hot.accept('./reducers', () => store.replaceReducer(persistReducer(persistConfig, combineReducers(reducers))));
        }
    }, []);

    return (<AuthenticatedContext.Provider value={{
        internalState,
        username,
        verified,
        whoami,
        claims
    }}>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    </AuthenticatedContext.Provider>);
}