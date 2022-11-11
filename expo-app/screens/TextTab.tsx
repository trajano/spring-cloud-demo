import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NetworkLoggerScreen } from './NetworkLoggerScreen';
import TabTwoScreen from './TabTwoScreen';
const Stack = createNativeStackNavigator();
export function TextTab() {
    return (<Stack.Navigator
        defaultScreenOptions={{
            headerLargeTitle: true
        }}>
        <Stack.Screen name="Text" component={TabTwoScreen} options={{
            headerLargeTitle: true, headerTransparent: true, headerBlurEffect: "light"
        }} />
    </Stack.Navigator>)
}