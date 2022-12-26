import { BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildSimpleEndpointConfiguration } from "@trajano/spring-docker-auth-context";
import { useDeepState } from "@trajano/react-hooks";
import { useEffect } from "react";
import { AuthenticatedEndpointConfiguration } from "../../navigation/login/types";

export function useStoredEndpointConfigurationEffect(
  initialEndpointConfiguration?: AuthenticatedEndpointConfiguration
): AuthenticatedEndpointConfiguration {
  const [defaultEndpointConfiguration, setDefaultEndpointConfiguration] =
    useDeepState<AuthenticatedEndpointConfiguration>(
      () =>
        initialEndpointConfiguration ??
        buildSimpleEndpointConfiguration(BASE_URL ?? "https://api.trajano.net/")
    );

  useEffect(() => {
    (async function () {
      let configuration = await AsyncStorage.getItem("ENDPOINT_CONFIGURATION");
      if (configuration) {
        setDefaultEndpointConfiguration(JSON.parse(configuration));
      }
    })();
  }, []);
  return defaultEndpointConfiguration;
}
