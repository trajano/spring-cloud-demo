import { useClockState } from "@trajano/react-hooks";
import { format } from "date-fns";
import { useRef, useState } from "react";
import { Animated, Text as RNText, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDayClockState } from "../hooks/useDayClockState";
import {
  ScrollView,
  Text,
  TextInput,
  View as HocView,
} from "../src/lib/native-unstyled";
import { propsToStyleSheet } from "../src/lib/native-unstyled/propsToStyleSheet";

const isHermes = () => !!(global as any).HermesInternal;
export function TextTest() {
  const {
    top: marginTop,
    left: marginLeft,
    right: marginRight,
    bottom: marginBottom,
  } = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const now = useClockState();
  const today = useDayClockState();
  const textRef = useRef<RNText>(null);
  return (
    <ScrollView
      marginTop={marginTop}
      marginLeft={marginLeft}
      marginBottom={marginBottom}
      marginRight={marginRight}
      backgroundColor="silver"
    >
      <View testID="clock">
        <Text>{format(today, "PPP")}</Text>
        <Text>{format(now, "PPPpp")}</Text>
      </View>
      <View testID="rnTextOne">
        <RNText>rnTextOne</RNText>
      </View>
      <View testID="animatedOne" style={{ backgroundColor: "red" }}>
        <Animated.Text>USTextOne</Animated.Text>
      </View>
      <HocView testID="hocOne" backgroundColor="yellow">
        <Text ref={textRef} color="blue">
          {username || "not set"}
        </Text>
      </HocView>
      <View testID="usTextOne">
        <Text>USTextOne</Text>
      </View>
      <View testID="rnText">
        <RNText>
          Test{" "}
          <RNText>
            Sub <RNText>Sub-Sub</RNText>
          </RNText>
        </RNText>
      </View>
      <View testID="animatedText">
        <Animated.Text>
          Test{" "}
          <Animated.Text>
            Sub <Animated.Text>Sub-Sub</Animated.Text>
          </Animated.Text>
        </Animated.Text>
      </View>
      <View testID="hocText">
        <Text style={{ fontFamily: "Nunito", fontSize: 32 }}>
          HOC Test{" "}
          <Text style={{ fontWeight: "bold" }}>
            Sub <Text style={{ fontStyle: "italic" }}>Sub-Sub</Text>
          </Text>{" "}
          HOC
        </Text>
      </View>

      <View testID="subView">
        <Text>
          Test{" "}
          <Text>
            Sub <Text>Sub-Sub</Text>
          </Text>
        </Text>
      </View>

      <TextInput
        _p="Username"
        defaultValue={username}
        onChangeText={setUsername}
        width={300}
        backgroundColor="#DDDDFF"
      />

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

      <HocView
        elevation={5}
        style={{
          width: 300,
          height: 300,
          borderRadius: 20,
          backgroundColor: "white",
          padding: 16,
        }}
      >
        <Text color="black">
          {JSON.stringify(
            propsToStyleSheet({ elevation: 5 }, {} as any),
            null,
            2
          )}
        </Text>
        <Text>hermes: {isHermes() ? "true" : "false"}</Text>
      </HocView>
    </ScrollView>
  );
}
export default TextTest;
