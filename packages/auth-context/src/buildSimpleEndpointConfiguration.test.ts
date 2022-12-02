import { buildSimpleEndpointConfiguration } from './buildSimpleEndpointConfiguration';
it('simple example', () => {
  expect(
    buildSimpleEndpointConfiguration(
      'https://api.trajano.net',
      'simple',
      'example'
    )
  ).toEqual({
    baseUrl: new URL('https://api.trajano.net'),
    authorizationEndpoint: new URL('https://api.trajano.net/auth'),
    refreshEndpoint: new URL('https://api.trajano.net/refresh'),
    pingEndpoint: new URL('https://api.trajano.net/ping'),
    revocationEndpoint: new URL('https://api.trajano.net/logout'),
    clientId: 'simple',
    clientSecret: 'example',
  });
});
it('simple example with URL', () => {
  expect(
    buildSimpleEndpointConfiguration(
      new URL('https://api.trajano.net'),
      'simple',
      'example'
    )
  ).toEqual({
    baseUrl: new URL('https://api.trajano.net'),
    authorizationEndpoint: new URL('https://api.trajano.net/auth'),
    refreshEndpoint: new URL('https://api.trajano.net/refresh'),
    pingEndpoint: new URL('https://api.trajano.net/ping'),
    revocationEndpoint: new URL('https://api.trajano.net/logout'),
    clientId: 'simple',
    clientSecret: 'example',
  });
});
