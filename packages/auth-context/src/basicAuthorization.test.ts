import { basicAuthorization } from './basicAuthorization';
it('simple example', () => {
  expect(basicAuthorization('simple', 'example')).toBe(
    'Basic c2ltcGxlOmV4YW1wbGU='
  );
});
