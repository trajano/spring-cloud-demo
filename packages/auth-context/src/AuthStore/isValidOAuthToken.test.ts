import type { OAuthToken } from '../OAuthToken';
import { isValidOAuthToken } from './isValidOAuthToken';

it('should work with valid', () => {
  expect(
    isValidOAuthToken({
      access_token: 'abc',
      refresh_token: '123',
      token_type: 'Bearer',
      expires_in: 444,
    })
  ).toBeTruthy();
});

it('should work with valid containing extra data', () => {
  expect(
    isValidOAuthToken({
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
    isValidOAuthToken({
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
    isValidOAuthToken({
      refresh_token: 'abc',
      token_type: 'Bearer',
      expires_in: 444,
      extra: 'info',
    } as unknown as OAuthToken)
  ).toBeFalsy();
});

it('should not work with empty string', () => {
  expect(isValidOAuthToken('' as unknown as OAuthToken)).toBeFalsy();
});

it('should not work with null', () => {
  expect(isValidOAuthToken(null as unknown as OAuthToken)).toBeFalsy();
});
