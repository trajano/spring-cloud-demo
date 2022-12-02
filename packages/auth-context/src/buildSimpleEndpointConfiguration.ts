import type { EndpointConfiguration } from './EndpointConfiguration';

/**
 * This builds a simple endpoint configuration that is used by Spring Docker project.
 * @param inBaseUrl base URL
 */
export function buildSimpleEndpointConfiguration(
  inBaseUrl: string | URL,
  clientId = 'unknown',
  clientSecret = 'unknown'
): EndpointConfiguration {
  const baseUrl =
    typeof inBaseUrl === 'string' ? new URL(inBaseUrl) : inBaseUrl;
  return {
    baseUrl,
    authorizationEndpoint: new URL('/auth', baseUrl.href),
    refreshEndpoint: new URL('/refresh', baseUrl.href),
    revocationEndpoint: new URL('/logout', baseUrl.href),
    pingEndpoint: new URL('/ping', baseUrl.href),
    clientId,
    clientSecret,
  };
}
