import { buildSimpleEndpointConfiguration } from './buildSimpleEndpointConfiguration';
it('simple example', () => {
  expect(
    buildSimpleEndpointConfiguration(
      'https://api.trajano.net/',
      'simple',
      'example'
    )
  ).toEqual({
    baseUrl: 'https://api.trajano.net/',
    authorizationEndpoint: 'https://api.trajano.net/auth',
    refreshEndpoint: 'https://api.trajano.net/refresh',
    pingEndpoint: 'https://api.trajano.net/ping',
    revocationEndpoint: 'https://api.trajano.net/logout',
    clientId: 'simple',
    clientSecret: 'example',
  });
});
it('should warn if the trailing slash is missing', () => {
  expect(() => {
    buildSimpleEndpointConfiguration(
      'https://api.trajano.net',
      'simple',
      'example'
    );
  }).toThrow(
    new Error("baseUrl=https://api.trajano.net should end with a '/'")
  );
});
