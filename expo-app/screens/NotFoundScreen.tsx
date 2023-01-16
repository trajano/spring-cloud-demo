import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { RootStackParamList } from "../navigation/paramLists";
import { Text, View } from "../src/lib/native-unstyled";

export default function NotFoundScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "NotFound">) {
  const navigateBackToRoot = useCallback(
    () => navigation.replace("Root"),
    [navigation]
  );
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This screen doesn't exist.</Text>
      <TouchableOpacity onPress={navigateBackToRoot} style={styles.link}>
        <Text style={styles.linkText}>Go to home screen!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
