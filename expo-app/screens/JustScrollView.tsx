import { useFocusEffect } from '@react-navigation/native';
import { AuthState, useAuth } from '@trajano/spring-docker-auth-context';
import { addSeconds, formatISO, getTime, millisecondsToSeconds, startOfSecond } from 'date-fns';
import { useCallback, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthenticated } from '../authenticated-context';
import { AuthenticatedEndpointConfiguration } from '../navigation/login/types';
import { Text } from '../src/lib/native-unstyled';
export function JustScrollView() {
    const safeAreaInsets = useSafeAreaInsets();
    const { accessToken, accessTokenExpiresOn, authState, refresh, endpointConfiguration, accessTokenExpired } = useAuth();
    const [timeRemaining, setTimeRemaining] = useState<number>(millisecondsToSeconds(accessTokenExpiresOn.getTime() - Date.now()))
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const [refreshing, setRefreshing] = useState(false);
    const { whoami } = useAuthenticated();
    const [whoamiJson, setWhoamiJson] = useState("");

    const updateClock = useCallback(() => {
        timerRef.current = setTimeout(() => {
            setTimeRemaining(millisecondsToSeconds(accessTokenExpiresOn.getTime() - Date.now()));
            updateClock();
        }, getTime(startOfSecond(addSeconds(Date.now(), 1))) - Date.now())
        return () => clearTimeout(timerRef.current);
    }, [timerRef, accessTokenExpiresOn])
    useFocusEffect(updateClock);
    return <Animated.ScrollView contentInset={safeAreaInsets}
        refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                    setRefreshing(true);
                    setWhoamiJson("");
                    await refresh();
                    setRefreshing(false);
                }}
            />
        }
    >
        <Text backgroundColor={accessTokenExpired ? "red" : undefined}>Access token <Text role="mono">{accessToken?.slice(-5)}</Text> expires on <Text fontWeight="bold">{formatISO(accessTokenExpiresOn)}</Text>        </Text>
        <Text>Time remaining <Text fontWeight="bold">{timeRemaining} seconds</Text></Text>
        <Text fontFamily='Lexend'>AuthState <Text fontFamily='Noto' fontWeight="bold">{AuthState[authState]}</Text></Text>
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