import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { AuthState, useAuth } from '@trajano/spring-docker-auth-context';
import { addSeconds, formatISO, getTime, millisecondsToSeconds, startOfSecond } from 'date-fns';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';

import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthenticated } from '../authenticated-context';
import { AuthenticatedEndpointConfiguration } from '../navigation/login/types';
import { Text, useRefreshControl } from '../src/lib/native-unstyled';
export function JustScrollView() {
    const safeAreaInsets = useSafeAreaInsets();
    const { accessToken, accessTokenExpiresOn, authState, refresh, endpointConfiguration, lastCheckOn, forceCheckAuthStorage, tokenRefreshable, accessTokenExpired, baseUrl } = useAuth();
    const [timeRemaining, setTimeRemaining] = useState<number>(millisecondsToSeconds(accessTokenExpiresOn.getTime() - Date.now()))
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const refreshControl = useRefreshControl(async () => {
        setWhoamiJson("");
        await refresh();
    });
    const { whoami } = useAuthenticated();
    const [whoamiJson, setWhoamiJson] = useState("");

    const expire = useMemo(() => async function expire() {
        await AsyncStorage.setItem(`auth.${baseUrl.toString()}..tokenExpiresAt`, new Date(Date.now() - 10).toISOString());
        await forceCheckAuthStorage();
    }, []);

    const updateClock = useCallback(() => {
        timerRef.current = setTimeout(() => {
            setTimeRemaining(millisecondsToSeconds(accessTokenExpiresOn.getTime() - Date.now()));
            updateClock();
        }, getTime(startOfSecond(addSeconds(Date.now(), 1))) - Date.now())
        return () => clearTimeout(timerRef.current);
    }, [timerRef, accessTokenExpiresOn])
    useFocusEffect(updateClock);
    const updateWhoAmI = useMemo(() => async () => {
        setWhoamiJson(JSON.stringify(await whoami(), null, 2));
    }, [whoami])

    return <Animated.ScrollView contentInset={safeAreaInsets}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={refreshControl}
    >
        <Text backgroundColor={accessTokenExpired ? "red" : undefined}>Access token <Text role="mono">{accessToken?.slice(-5)}</Text> expires on <Text fontWeight="bold">{formatISO(accessTokenExpiresOn, { representation: "time" })}</Text></Text>
        <Text>Time remaining <Text fontWeight="bold">{timeRemaining} seconds</Text></Text>
        <Text style={{ fontFamily: 'NotoSansMono', fontSize: 16 }}>Last check <Text bold>{formatISO(lastCheckOn, { representation: "time" })}</Text></Text>
        <Text backgroundColor={tokenRefreshable ? undefined : "red"}>{tokenRefreshable ? "Token refreshable" : "TOKEN NOT REFRESHABLE"}</Text>
        <Text fontFamily='Lexend'>AuthState <Text fontFamily='Noto' fontWeight="bold">{AuthState[authState]}</Text></Text>

        <Button onPress={expire}>Expire {baseUrl.toString()}</Button>
        <Button onPress={updateWhoAmI}>{(endpointConfiguration as AuthenticatedEndpointConfiguration).whoamiEndpoint}</Button>


        <View style={{
            width: 300,
            height: 400,
            borderRadius: 20,
            backgroundColor: "transparent",
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,

            elevation: 5,
        }}>
            <Text color="black">{whoamiJson.substring(0, 1000)}</Text>
        </View>
    </Animated.ScrollView>
}