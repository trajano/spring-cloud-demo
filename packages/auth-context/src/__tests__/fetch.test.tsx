import fetchMock from 'fetch-mock-jest';
describe("http", () => {
  beforeEach(() => {
    // jest.useFakeTimers('modern');
    jest.useFakeTimers({ advanceTimers: true });
  })

  it("Simple fetch example", async () => {
    jest.setSystemTime(new Date("2022-01-01T00:00:00Z"));
    fetchMock.mock("https://trajano.net", { body: { hello: "world" } })
    const response = await fetch("https://trajano.net");
    expect(Date.now()).toBe(new Date("2022-01-01T00:00:00Z").getTime());
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ "hello": "world" });
  })

  it("Error example", async () => {
    jest.setSystemTime(new Date("2022-01-01T00:00:00Z"));
    fetchMock.mock("https://trajano.net/bad-request", { status: 400, body: { bad: "request" } })
    const response = await fetch("https://trajano.net/bad-request");
    expect(Date.now()).toBe(new Date("2022-01-01T00:00:00Z").getTime());
    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({ "bad": "request" });
  })

  afterEach(() => {
    jest.useRealTimers();
    fetchMock.mockReset();
  })
})
