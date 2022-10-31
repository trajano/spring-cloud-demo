export class AuthenticationClientError extends Error {
  constructor(public response: Response) {
    super(`HTTP Error ${response.status}`);
  }
}
