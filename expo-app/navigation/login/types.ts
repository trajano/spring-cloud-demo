import { ParamListBase } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { EndpointConfiguration } from "@trajano/spring-docker-auth-context";

export interface LoginStackParamList extends ParamListBase {
  Login: undefined;
  Modal: undefined;
}
export type LoginStackScreenProps<Screen extends keyof LoginStackParamList> =
  NativeStackScreenProps<LoginStackParamList, Screen>;
export type AuthenticatedEndpointConfiguration = EndpointConfiguration & {
  /** Whoami endpoint. Defaults to `whoami/` */
  whoamiEndpoint?: string;
  verifyClaims?: boolean;
};
