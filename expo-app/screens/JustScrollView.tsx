import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { AuthState, AuthStore, useAuth } from '@trajano/spring-docker-auth-context';
import { addSeconds, formatISO, getTime, millisecondsToSeconds, startOfSecond } from 'date-fns';
import { useCallback, useRef, useState } from 'react';
import { Animated, View } from 'react-native';

import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthenticated } from '../authenticated-context';
import { AuthenticatedEndpointConfiguration } from '../navigation/login/types';
import { Text } from '../src/lib/native-unstyled';
import { useRefreshControl } from '../src/lib/native-unstyled';
export function JustScrollView() {
    const safeAreaInsets = useSafeAreaInsets();
    const { accessToken, accessTokenExpiresOn, authState, refresh, endpointConfiguration, lastCheckOn, nextCheckOn, accessTokenExpired, baseUrl } = useAuth();
    const [timeRemaining, setTimeRemaining] = useState<number>(millisecondsToSeconds(accessTokenExpiresOn.getTime() - Date.now()))
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const refreshControl = useRefreshControl(async () => {
        setWhoamiJson("");
        await refresh();
    });
    const { whoami } = useAuthenticated();
    const [whoamiJson, setWhoamiJson] = useState("");

    async function expire() {
        await AsyncStorage.setItem(`auth.${baseUrl.toString()}..tokenExpiresAt`, new Date(Date.now() - 10).toISOString());
    }

    const updateClock = useCallback(() => {
        timerRef.current = setTimeout(() => {
            setTimeRemaining(millisecondsToSeconds(accessTokenExpiresOn.getTime() - Date.now()));
            updateClock();
        }, getTime(startOfSecond(addSeconds(Date.now(), 1))) - Date.now())
        return () => clearTimeout(timerRef.current);
    }, [timerRef, accessTokenExpiresOn])
    useFocusEffect(updateClock);

    return <Animated.ScrollView contentInset={safeAreaInsets}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={refreshControl}
    >
        <Text backgroundColor={accessTokenExpired ? "red" : undefined}>Access token <Text role="mono">{accessToken?.slice(-5)}</Text> expires on <Text fontWeight="bold">{formatISO(accessTokenExpiresOn, { representation: "time" })}</Text></Text>
        <Text>Time remaining <Text fontWeight="bold">{timeRemaining} seconds</Text></Text>
        <Text style={{ fontFamily: 'NotoSansMono', fontSize: 16 }}>Last check <Text bold>{formatISO(lastCheckOn, { representation: "time" })}</Text></Text>
        <Text style={{ fontFamily: 'NotoSansMono', fontSize: 16 }}>Next check <Text bold>{nextCheckOn ? formatISO(nextCheckOn, { representation: "time" }) : "none"}</Text></Text>
        <Text fontFamily='Lexend'>AuthState <Text fontFamily='Noto' fontWeight="bold">{AuthState[authState]}</Text></Text>
        <Button onPress={expire}>Expire {baseUrl.toString()}</Button>
        <Button onPress={async () => {
            setWhoamiJson(JSON.stringify(await whoami(), null, 2));
        }}>{(endpointConfiguration as AuthenticatedEndpointConfiguration).whoamiEndpoint}</Button>


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