import type { EndpointConfiguration } from './EndpointConfiguration';

/**
 * This builds a simple endpoint configuration that is used by Spring Docker project.
 * It does the conversion to URL to ensure that the input is valid.
 * @param inBaseUrl base URL must have trailing slash.
 */
export function buildSimpleEndpointConfiguration(
  inBaseUrl: string | URL,
  clientId = 'unknown',
  clientSecret = 'unknown'
): EndpointConfiguration {
  const baseUrl =
    typeof inBaseUrl === 'string' ? inBaseUrl : inBaseUrl.toString();
  if (__DEV__) {
    if (baseUrl.substring(baseUrl.length - 1) !== '/') {
      throw new Error(`baseUrl=${baseUrl} should end with a '/'`);
    }
  }
  return {
    baseUrl: baseUrl,
    authorizationEndpoint: baseUrl + 'auth',
    refreshEndpoint: baseUrl + 'refresh',
    revocationEndpoint: baseUrl + 'logout',
    pingEndpoint: baseUrl + 'ping',
    clientId,
    clientSecret,
  };
}
