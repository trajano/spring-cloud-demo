/**
 * @jest-environment node
 */
import 'whatwg-fetch'
import fetchMock from 'fetch-mock-jest';
describe('http', () => {
  let fetchConfigResponse: (new () => Response) | undefined;
  beforeEach(() => {
    fetchConfigResponse = fetchMock.config.Response;
    jest.useFakeTimers({ advanceTimers: true });
  });
  afterEach(() => {
    jest.useRealTimers();
    fetchMock.mockReset();
    fetchMock.config.Response = fetchConfigResponse;
  });

  it('Simple fetch example', async () => {
    jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));
    fetchMock.mock('https://trajano.net', { body: { hello: 'world' } });
    const response = await fetch('https://trajano.net');
    expect(Date.now()).toBe(new Date('2022-01-01T00:00:00Z').getTime());
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ hello: 'world' });
  });
  it('Non-JSON json() call', async () => {
    jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));
    fetchMock.mock('https://trajano.net', { body: 'not a json' });
    const response = await fetch('https://trajano.net');
    expect(Date.now()).toBe(new Date('2022-01-01T00:00:00Z').getTime());
    expect(response.status).toBe(200);
    try {
      await response.json();
      fail('should not get here');
    } catch (e) {
      expect(e instanceof Error).toBeTruthy();
    }
  });

  it('Error example', async () => {
    jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));
    fetchMock.mock('https://trajano.net/bad-request', {
      status: 400,
      body: { bad: 'request' },
    });
    const response = await fetch('https://trajano.net/bad-request');
    expect(Date.now()).toBe(new Date('2022-01-01T00:00:00Z').getTime());
    expect(response.status).toBe(400);
    expect(response.ok).toBe(false);
    expect(await response.json()).toStrictEqual({ bad: 'request' });
  });

  it('401 Error example', async () => {
    jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));
    fetchMock.mock('https://trajano.net/bad-request', {
      status: 401,
      body: { bad: 'request' },
    });
    const response = await fetch('https://trajano.net/bad-request');
    expect(Date.now()).toBe(new Date('2022-01-01T00:00:00Z').getTime());
    expect(response.status).toBe(401);
    expect(response.ok).toBe(false);
    expect(await response.json()).toStrictEqual({ bad: 'request' });
  });

  it('should work with Response.error()', async () => {
    fetchMock.config.Response = Response;
    fetchMock.mock('https://trajano.net/bad-request', Response.error());
    const response = await fetch('https://trajano.net/bad-request');
    expect(response.status).toBe(0);
  });
  it('should work with global.Response.error()', async () => {
    fetchMock.config.Response = global.Response;
    fetchMock.mock('https://trajano.net/bad-request', global.Response.error());
    const response = await fetch('https://trajano.net/bad-request');
    expect(response.status).toBe(0);
  });
  it('Response.error type check', async () => {
    fetchMock.config.Response = Response;
    expect(Response.error() instanceof Response).toBe(true);
    expect(
      fetchMock.config.Response?.prototype.isPrototypeOf(Response.error())
    ).toBe(true);
  });
});
