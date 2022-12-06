import { Animated, View, Text as RNText } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../components";
import { Text as HocText, NativeText } from './hoc'
import { useRef } from 'react'

export function TextTest() {
    const { top: marginTop, left: marginLeft, right: marginRight, bottom: marginBottom } = useSafeAreaInsets();
    const textRef = useRef<RNText>()
    return (<View
        style={{
            marginTop,
            marginLeft,
            marginBottom,
            marginRight
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
        <View testID="hocNativeOne">
            <NativeText>HocTextOneNative</NativeText>
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
    </View>)
}