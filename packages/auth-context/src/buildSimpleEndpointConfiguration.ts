import type { EndpointConfiguration } from './EndpointConfiguration';

/**
 * This builds a simple endpoint configuration that is used by Spring Docker
 * project. It does the conversion to URL to ensure that the input is valid.
 *
 * @param inBaseUrl Base URL must have trailing slash.
 */
export function buildSimpleEndpointConfiguration(
  baseUrl: string,
  clientId = 'unknown',
  clientSecret = 'unknown'
): EndpointConfiguration {
  /* istanbul ignore next */
  if (__DEV__) {
    if (!baseUrl.endsWith('/')) {
      throw new Error(`baseUrl=${baseUrl} should end with a '/'`);
    }
  }
  return {
    baseUrl: baseUrl,
    authorizationEndpoint: `${baseUrl}auth`,
    refreshEndpoint: `${baseUrl}refresh`,
    revocationEndpoint: `${baseUrl}logout`,
    pingEndpoint: `${baseUrl}ping`,
    clientId,
    clientSecret,
  };
}
