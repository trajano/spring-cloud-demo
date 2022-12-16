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
  try {
    buildSimpleEndpointConfiguration(
      'https://api.trajano.net',
      'simple',
      'example'
    );
    fail('should not get here');
  } catch (e: unknown) {
    expect(e).toStrictEqual(
      new Error("baseUrl=https://api.trajano.net should end with a '/'")
    );
  }
});

it('simple example with URL', () => {
  const configuration = buildSimpleEndpointConfiguration(
    new URL('https://api.trajano.net/'),
    'simple',
    'example'
  );

  expect(configuration).toEqual({
    baseUrl: 'https://api.trajano.net/',
    authorizationEndpoint: 'https://api.trajano.net/auth',
    refreshEndpoint: 'https://api.trajano.net/refresh',
    pingEndpoint: 'https://api.trajano.net/ping',
    revocationEndpoint: 'https://api.trajano.net/logout',
    clientId: 'simple',
    clientSecret: 'example',
  });
  expect(configuration).toEqual(
    JSON.parse(`
      {
        "authorizationEndpoint": "https://api.trajano.net/auth",
        "baseUrl": "https://api.trajano.net/",
        "pingEndpoint": "https://api.trajano.net/ping",
        "refreshEndpoint": "https://api.trajano.net/refresh",
        "revocationEndpoint": "https://api.trajano.net/logout",
        "clientId": "simple",
        "clientSecret": "example"
      }
      `)
  );
  expect(configuration.pingEndpoint).toBe('https://api.trajano.net/ping');
});

it('simple example with URL with no trailing slash', () => {
  const configuration = buildSimpleEndpointConfiguration(
    new URL('https://api.trajano.net'),
    'simple',
    'example'
  );

  expect(configuration).toEqual({
    baseUrl: 'https://api.trajano.net/',
    authorizationEndpoint: 'https://api.trajano.net/auth',
    refreshEndpoint: 'https://api.trajano.net/refresh',
    pingEndpoint: 'https://api.trajano.net/ping',
    revocationEndpoint: 'https://api.trajano.net/logout',
    clientId: 'simple',
    clientSecret: 'example',
  });
  expect(configuration).toEqual(
    JSON.parse(`
      {
        "authorizationEndpoint": "https://api.trajano.net/auth",
        "baseUrl": "https://api.trajano.net/",
        "pingEndpoint": "https://api.trajano.net/ping",
        "refreshEndpoint": "https://api.trajano.net/refresh",
        "revocationEndpoint": "https://api.trajano.net/logout",
        "clientId": "simple",
        "clientSecret": "example"
      }
      `)
  );
  expect(configuration.pingEndpoint).toBe('https://api.trajano.net/ping');
});
