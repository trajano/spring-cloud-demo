import type { EndpointConfiguration } from './EndpointConfiguration';

export function validateEndpointConfiguration(
  endpointConfiguration: EndpointConfiguration
) {
  if (
    endpointConfiguration.baseUrl.substring(
      endpointConfiguration.baseUrl.length - 1
    ) !== '/'
  ) {
    throw new Error(
      `baseUrl=${endpointConfiguration.baseUrl} should end with a '/'`
    );
  }
}
