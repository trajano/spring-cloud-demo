import type { EndpointConfiguration } from './EndpointConfiguration';

export function validateEndpointConfiguration(
  endpointConfiguration: EndpointConfiguration
) {
  if (!endpointConfiguration.baseUrl.endsWith('/')) {
    throw new Error(
      `baseUrl=${endpointConfiguration.baseUrl} should end with a '/'`
    );
  }
}
