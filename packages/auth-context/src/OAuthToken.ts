export type OAuthToken = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  [key: string]: unknown;
};
