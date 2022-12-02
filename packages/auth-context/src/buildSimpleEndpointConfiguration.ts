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
  return {
    baseUrl: baseUrl.href,
    authorizationEndpoint: new URL('auth', baseUrl.href).href,
    refreshEndpoint: new URL('refresh', baseUrl.href).href,
    revocationEndpoint: new URL('logout', baseUrl.href).href,
    pingEndpoint: new URL('ping', baseUrl.href).href,
    clientId,
    clientSecret,
  };
}
