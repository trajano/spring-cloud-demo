export interface OAuthToken {
  [key: string]: unknown;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}
