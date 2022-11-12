import { createDrawerNavigator } from "@react-navigation/drawer";
import { JustScrollView } from "./JustScrollView";
import { StackNavigatorScrollView } from "./StackNavigatorScrollView";
import { TabOne } from "./TabOne";
const Drawer = createDrawerNavigator();
export function DrawerNavigator() {
    return (<Drawer.Navigator screenOptions={{ headerShown: false }}>
        <Drawer.Screen name="TabOne" component={TabOne} options={{ headerShown: false }} />
        <Drawer.Screen name="JustScrollView" component={JustScrollView} options={{ headerShown: false }} />
        <Drawer.Screen name="StackNavigatorScrollView" component={StackNavigatorScrollView} options={{ headerShown: false }} />
    </Drawer.Navigator>)
}