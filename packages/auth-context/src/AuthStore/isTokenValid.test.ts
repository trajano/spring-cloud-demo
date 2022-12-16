import type { OAuthToken } from 'src/OAuthToken';
import { isTokenValid } from './isTokenValid';

it('should work with valid', () => {
  expect(
    isTokenValid({
      access_token: 'abc',
      refresh_token: '123',
      token_type: 'Bearer',
      expires_in: 444,
    })
  ).toBeTruthy();
});

it('should work with valid containing extra data', () => {
  expect(
    isTokenValid({
      access_token: 'abc',
      refresh_token: '123',
      token_type: 'Bearer',
      expires_in: 444,
      extra: 'info',
    })
  ).toBeTruthy();
});

it('should not work with empty token data', () => {
  expect(
    isTokenValid({
      access_token: '',
      refresh_token: '',
      token_type: 'Bearer',
      expires_in: 444,
      extra: 'info',
    })
  ).toBeFalsy();
});
it('should not work with missing data', () => {
  expect(
    isTokenValid({
      refresh_token: 'abc',
      token_type: 'Bearer',
      expires_in: 444,
      extra: 'info',
    } as unknown as OAuthToken)
  ).toBeFalsy();
});

it('should not work with empty string', () => {
  expect(isTokenValid('' as unknown as OAuthToken)).toBeFalsy();
});

it('should not work with null', () => {
  expect(isTokenValid(null as unknown as OAuthToken)).toBeFalsy();
});
