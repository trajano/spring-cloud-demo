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
    typeof inBaseUrl === 'string' ? new URL(inBaseUrl) : inBaseUrl;
  if (__DEV__) {
    if (baseUrl.href.substring(baseUrl.href.length - 1) !== '/') {
      console.error("base URL should end with a '/'")
    }
  }
  return {
    baseUrl: baseUrl.href,
    authorizationEndpoint: inBaseUrl + 'auth',
    refreshEndpoint: inBaseUrl + 'refresh',
    revocationEndpoint: inBaseUrl + 'logout',
    pingEndpoint: inBaseUrl + 'ping',
    clientId,
    clientSecret,
  };
}
