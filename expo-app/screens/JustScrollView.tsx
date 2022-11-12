import { Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../src/components';
export function JustScrollView() {
    const safeAreaInsets = useSafeAreaInsets();
    return <Animated.ScrollView contentInset={safeAreaInsets}>
        <Text>
            sadfasdf
            sadfasdfasdf

            sadfas
        </Text>
    </Animated.ScrollView>
}