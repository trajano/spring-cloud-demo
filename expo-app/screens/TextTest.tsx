import { useRef } from 'react';
import { Animated, Text as RNText } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "../src/components";
import { Text as HocText } from '../src/lib/native-unstyled/hoc';
import { propsToStyleSheet } from '../src/lib/native-unstyled/propsToStyleSheet';

export function TextTest() {
    const { top: marginTop, left: marginLeft, right: marginRight, bottom: marginBottom } = useSafeAreaInsets();
    const textRef = useRef<RNText>(null);
    return (<View
        style={{
            marginTop,
            marginLeft,
            marginBottom,
            marginRight,
            backgroundColor: "silver",
        }}
    >
        <View testID="rnTextOne">
            <RNText>RNTestOne</RNText>
        </View>
        <View testID="animatedOne" style={{ backgroundColor: "red" }}>
            <Animated.Text>USTextOne</Animated.Text>
        </View>
        <View testID="hocOne">
            <HocText ref={textRef}>HocTextOne</HocText>
        </View>
        <View testID="usTextOne">
            <Text>USTextOne</Text>
        </View>
        <View testID="rnText">
            <RNText>Test <RNText>Sub <RNText>Sub-Sub</RNText></RNText></RNText>
        </View>
        <View testID="animatedText">
            <Animated.Text>Test <Animated.Text>Sub <Animated.Text>Sub-Sub</Animated.Text></Animated.Text></Animated.Text>
        </View>
        <View testID="hocText">
            <HocText style={{ fontFamily: "Nunito", fontSize: 32 }}>HOC Test <HocText style={{ fontWeight: "bold" }}>Sub <HocText style={{ fontStyle: "italic" }}>Sub-Sub</HocText></HocText> HOC</HocText>
        </View>

        <View testID="subView">
            <Text>Test <Text>Sub <Text>Sub-Sub</Text></Text></Text>
        </View>

        {/* <View style={{
            width: 200,
            height: 200,
            borderRadius: 20,
            backgroundColor: "white",
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            padding: 16
        }}>
            <Text color="black">whoami</Text>
        </View> */}

        <View elevation={5} style={{
            width: 300,
            height: 300,
            borderRadius: 20,
            backgroundColor: "white",
            padding: 16,
        }} >
            <Text color="black">{JSON.stringify(propsToStyleSheet({ elevation: 5 }, {} as any), null, 2)}</Text>
        </View>

    </View>)
}
export default TextTest;