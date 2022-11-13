
import { useAuth } from '@trajano/spring-docker-auth-context';
import { formatISO } from 'date-fns';
import { Animated } from 'react-native';
import { Text, View } from '../../src/components';

export function StackNavigatorScrollViewScreen() {
    const { lastAuthEvents } = useAuth();
    return <Animated.ScrollView
        contentInsetAdjustmentBehavior="automatic"
    >
        {lastAuthEvents.map(event => {
            const { type, reason } = event;
            return (<View key={event.key}><Text><Text fontWeight="bold">{type}</Text> {formatISO(event.on, { representation: "time" })}</Text>
                <Text>{reason}</Text></View>)
        })}
    </Animated.ScrollView>
}