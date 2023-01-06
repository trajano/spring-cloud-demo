import { BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDeepState } from "@trajano/react-hooks";
import { buildSimpleEndpointConfiguration, validateEndpointConfiguration } from "@trajano/spring-docker-auth-context";
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
      const configuration = await AsyncStorage.getItem(
        "ENDPOINT_CONFIGURATION"
      );
      if (configuration) {
        try {
          const storedConfiguration = JSON.parse(configuration) as AuthenticatedEndpointConfiguration;
          validateEndpointConfiguration(storedConfiguration);
          setDefaultEndpointConfiguration(storedConfiguration);
        } catch (err) {
          console.error(`Got error validating the configuration ${configuration}, not setting the value`, err)
        }
      }
    })();
  }, []);
  return defaultEndpointConfiguration;
}
