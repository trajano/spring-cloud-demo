import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NetworkLoggerScreen } from './NetworkLoggerScreen';
const Stack = createNativeStackNavigator();
export function NetworkLoggerTab() {
    return (<Stack.Navigator
        defaultScreenOptions={{
            headerLargeTitle: false
        }}>
        <Stack.Screen name="NetworkLoggerScreen" component={NetworkLoggerScreen} />
    </Stack.Navigator>)
}