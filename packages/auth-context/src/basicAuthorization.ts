import { encode } from 'js-base64';

export function basicAuthorization(username: string, password: string): string {
  return 'Basic ' + encode(username + ':' + password);
}
