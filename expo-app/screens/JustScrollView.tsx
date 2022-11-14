import { useFocusEffect } from '@react-navigation/native';
import { AuthState, useAuth } from '@trajano/spring-docker-auth-context';
import { addSeconds, formatISO, getTime, millisecondsToSeconds, startOfSecond } from 'date-fns';
import { useCallback, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthenticated } from '../authenticated-context';
import { Text } from '../src/components';
export function JustScrollView() {
    const safeAreaInsets = useSafeAreaInsets();
    const { accessToken, accessTokenExpiresOn, authState, refresh } = useAuth();
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
        <Text>Access token <Text fontFamily="NotoSansMono">{accessToken?.slice(-5)}</Text> expires on <Text fontWeight="bold">{formatISO(accessTokenExpiresOn)}</Text>        </Text>
        <Text>Time remaining <Text fontWeight="bold">{timeRemaining} seconds</Text></Text>
        <Text>AuthState <Text fontWeight="bold">{AuthState[authState]}</Text>        </Text>
        <Button onPress={async () => {
            setWhoamiJson(JSON.stringify(await whoami(), null, 2));
        }}>Who Am I?</Button>
        <Text fontFamily="NotoSansMono">{whoamiJson}</Text>
    </Animated.ScrollView>
}