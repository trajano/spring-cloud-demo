import NetInfo, {
  NetInfoState,
  NetInfoStateType,
} from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { AppState } from "react-native";
import NetworkLogger from "react-native-network-logger";

export function NetworkLoggerScreen({
  navigation,
}: NativeStackScreenProps<any, "NetworkLoggerScreen">) {
  const networkInfoHandler = useCallback(
    (nextState: NetInfoState) => {
      navigation.setOptions({
        title: `${NetInfoStateType[nextState.type]} c=${
          nextState.isConnected
        } i=${nextState.isInternetReachable} s=${AppState.currentState}`,
      });
    },
    [navigation]
  );
  useFocusEffect(
    useCallback(() => {
      const cancelNetInfoSubscription =
        NetInfo.addEventListener(networkInfoHandler);
      return () => cancelNetInfoSubscription();
    }, [networkInfoHandler])
  );
  return (
    <NetworkLogger
      theme={{
        colors: {},
      }}
    />
  );
}
