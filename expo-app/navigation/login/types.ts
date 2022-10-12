import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type LoginStackParamList = {
  Login: undefined;
  Modal: undefined;
};
export type LoginStackScreenProps<Screen extends keyof LoginStackParamList> =
  NativeStackScreenProps<LoginStackParamList, Screen>;
