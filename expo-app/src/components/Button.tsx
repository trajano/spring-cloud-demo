import { PressableProps } from "react-native";
import { Pressable, StyleProps, Text, useTheming } from "../lib/native-unstyled"

type ButtonProps = StyleProps & PressableProps & {

    children: string | string[];
}

export const Button = ({ children, onPress }: ButtonProps) => {

    const { colors } = useTheming();

    return <Pressable onPress={onPress} height={30} alignItems="center" justifyContent="center"><Text fontSize={16}>{children}</Text></Pressable>

}