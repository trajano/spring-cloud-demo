import { createDrawerNavigator } from "@react-navigation/drawer";
import { ComponentType } from 'react';
import { MainDrawerParamList } from "../types";
import { JustScrollView } from "./JustScrollView";
import { StackNavigatorScrollView } from "./StackNavigatorScrollView";
import { TabOne } from "./TabOne";
const Drawer = createDrawerNavigator<MainDrawerParamList>();
export function DrawerNavigator() {
    // hack TabOne as ComponentType for now.
    return (<Drawer.Navigator screenOptions={{ headerShown: false }}>
        <Drawer.Screen name="TabOne" component={TabOne as ComponentType} options={{ headerShown: false }} />
        <Drawer.Screen name="JustScrollView" component={JustScrollView} options={{ headerShown: false }} />
        <Drawer.Screen name="StackNavigatorScrollView" component={StackNavigatorScrollView} options={{
            title: "Auth Event Log",
            headerShown: false
        }} />
    </Drawer.Navigator>)
}