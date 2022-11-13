
import { useAuth } from '@trajano/spring-docker-auth-context';
import { Animated } from 'react-native';
import { Text, View } from '../../src/components';

export function StackNavigatorScrollViewScreen() {
    const { lastAuthEvents } = useAuth();
    return <Animated.ScrollView
        contentInsetAdjustmentBehavior="automatic"
    >
        {lastAuthEvents.map(event => {
            const { type, reason,...rest } = event;
            return (<View><Text fontWeight="bold">{type}</Text>
                <Text>{reason}</Text></View>)
        })}
    </Animated.ScrollView>
}