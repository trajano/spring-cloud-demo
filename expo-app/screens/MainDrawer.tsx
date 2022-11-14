import { createDrawerNavigator } from "@react-navigation/drawer";
import { useWindowDimensions } from 'react-native';
import { ComponentType, useMemo } from 'react';
import { MainDrawerParamList } from "../types";
import { JustScrollView } from "./JustScrollView";
import { StackNavigatorScrollView } from "./StackNavigatorScrollView";
import { TabOne } from "./TabOne";
const Drawer = createDrawerNavigator<MainDrawerParamList>();
export function DrawerNavigator() {
    const { width, height } = useWindowDimensions();
    const defaultStatus = useMemo(() => width > height ? "open" : "closed", [width, height]);
    const drawerType = useMemo(() => width > height ? "permanent" : undefined, [width, height]);
    // hack TabOne as ComponentType for now.
    return (<Drawer.Navigator screenOptions={{ headerShown: false, drawerType }} defaultStatus={defaultStatus}     >
        <Drawer.Screen name="TabOne" component={TabOne as ComponentType} options={{ headerShown: false }} />
        <Drawer.Screen name="JustScrollView" component={JustScrollView} options={{ headerShown: false, title: "Access token" }} />
        <Drawer.Screen name="StackNavigatorScrollView" component={StackNavigatorScrollView} options={{
            title: "Auth Event Log",
            headerShown: false
        }} />
    </Drawer.Navigator>)
}