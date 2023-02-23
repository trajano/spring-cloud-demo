import NetInfo from "@react-native-community/netinfo";
import type { EndpointConfiguration } from "@trajano/spring-docker-auth-context";
import { useEffect, useState } from "react";

export const useBackendReachable = (
  endpointConfiguration: EndpointConfiguration
): boolean => {
  const [backendReachable, setBackendReachable] = useState(false);
  useEffect(() => {
    NetInfo.configure({
      reachabilityUrl: endpointConfiguration.pingEndpoint,
      reachabilityTest: (response) =>
        Promise.resolve(response.status === 200 || response.status === 204),
      useNativeReachability: true,
    });

    (async () => {
      const nextStatus = await NetInfo.refresh();
      setBackendReachable(nextStatus.isInternetReachable === true);
    })();

    return NetInfo.addEventListener((nextStatus) => {
      setBackendReachable(nextStatus.isInternetReachable === true);
    });
  }, [endpointConfiguration.pingEndpoint]);
  return backendReachable;
};
